from flask import Flask, jsonify, request
from flask_restful import Api
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from tool import get_tool_data
from network_stats import calculate_network_stats, log_network_stats_event, check_db_connection, get_network_stats_logs
from utils import cache_response
from config import CACHE_DURATION, CORS_OPTIONS
import os
import requests
import time
from functools import wraps
from flask import request
from datetime import datetime
import pytz

app = Flask(__name__)
CORS(app, **CORS_OPTIONS)
api = Api(app)

# 设置JSON编码
app.json.ensure_ascii = False

@app.route('/health')
def health_check():
    """健康检查接口"""
    return {'status': 'ok'}

@app.route('/api/qubic/tool', methods=['GET'])
@cache_response(CACHE_DURATION)
def get_tool():
    """综合数据接口"""
    return get_tool_data()

def update_network_stats():
    """更新网络统计数据的定时任务"""
    try:
        current_time = datetime.now(pytz.UTC)
        print(f"\n=== Scheduled update triggered at {current_time} ===")
        log_network_stats_event('info', f"Scheduled update triggered at {current_time}")
        
        with app.app_context():
            print("Getting tool data...")
            response = get_tool_data()
            
            # 将Response对象转换为字典
            if hasattr(response, 'json'):
                data = response.json
            else:
                data = response
                
            if not data:
                error_msg = "Failed to get tool data: Response is empty"
                log_network_stats_event('error', error_msg)
                print(error_msg)
                return
                
            if not isinstance(data, dict):
                error_msg = f"Invalid tool data format: {type(data)}"
                log_network_stats_event('error', error_msg, {'data': str(data)})
                print(error_msg)
                return
            
            print("Calculating network stats...")
            calculate_network_stats(data)
            print("Network stats update completed")
            
    except Exception as e:
        error_msg = f"Error in update_network_stats: {str(e)}"
        log_network_stats_event('error', error_msg)
        print(error_msg)

# 将装饰器定义移到这里
def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key or api_key != os.getenv('ADMIN_API_KEY'):
            return jsonify({
                'status': 'error',
                'message': 'Invalid or missing API key'
            }), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/update-token', methods=['GET'])
@require_api_key
def update_token():
    try:
        print("Starting token update process...")
        
        # 获取当前 token
        current_token = os.getenv('QUBIC_API_KEY', '')
        if not current_token:
            raise Exception('QUBIC_API_KEY not found in environment')
        print(f"Current token (first 10 chars): {current_token[:10]}...")
        
        # 验证必要的环境变量
        required_env_vars = ['QUBIC_USERNAME', 'QUBIC_PASSWORD', 'VERCEL_PROJECT_ID', 'VERCEL_TOKEN']
        missing_vars = [var for var in required_env_vars if not os.getenv(var)]
        if missing_vars:
            raise Exception(f'Missing required environment variables: {", ".join(missing_vars)}')
        
        # 打印环境变量状态（不包含敏感值）
        print(f"Environment variables check:")
        print(f"VERCEL_PROJECT_ID: {os.getenv('VERCEL_PROJECT_ID')}")
        print(f"QUBIC_USERNAME: {os.getenv('QUBIC_USERNAME')}")
        
        # 登录获取新token
        login_data = {
            'username': os.getenv('QUBIC_USERNAME'),
            'password': os.getenv('QUBIC_PASSWORD')
        }
        print(f"Attempting login with username: {login_data['username']}")
        
        # 添加重试机制
        for attempt in range(3):
            try:
                response = requests.post(
                    'https://api.qubic.li/Auth/Login', 
                    json=login_data,
                    timeout=10
                )
                response.raise_for_status()
                result = response.json()
                break
            except requests.exceptions.RequestException as e:
                if attempt == 2:
                    raise Exception(f'Failed to login after 3 attempts: {str(e)}')
                print(f"Login attempt {attempt + 1} failed, retrying...")
                time.sleep(2)
        
        new_token = result.get('token')
        if not new_token:
            raise Exception('No token in response')
            
        print("Login successful, received new token")
        
        # 如果 token 相同，无需更新
        if new_token == current_token:
            print("New token is same as current token")
            return jsonify({
                'success': True,
                'message': 'Token is still valid, no update needed',
                'token_updated': False,
                'current_token_preview': current_token[:10] + '...'
            })
        
        # 更新 Vercel 环境变量
        project_id = os.getenv('VERCEL_PROJECT_ID')
        vercel_token = os.getenv('VERCEL_TOKEN')
        
        print(f"Updating Vercel env var for project: {project_id}")
        headers = {
            'Authorization': f'Bearer {vercel_token}',
            'Content-Type': 'application/json'
        }
        
        # 检查环境变量是否存在
        try:
            print("Checking existing env vars...")
            env_check_url = f'https://api.vercel.com/v9/projects/{project_id}/env'
            print(f"Request URL: {env_check_url}")
            
            env_check_response = requests.get(
                env_check_url,
                headers=headers,
                timeout=10
            )
            
            if env_check_response.status_code != 200:
                print(f"Error response from Vercel: {env_check_response.text}")
                raise Exception(f"Failed to check env vars: {env_check_response.text}")
                
            env_data = env_check_response.json()
            print(f"Received env vars data: {str(env_data)[:200]}...")  # 只打印前200个字符
            
            existing_envs = env_data.get('envs', [])
            existing_env = next((env for env in existing_envs if env['key'] == 'QUBIC_API_KEY'), None)
            
            if existing_env:
                print(f"Found existing env var with id: {existing_env['id']}")
                env_data = {'value': new_token}
                vercel_response = requests.patch(
                    f'https://api.vercel.com/v9/projects/{project_id}/env/{existing_env["id"]}',
                    headers=headers,
                    json=env_data,
                    timeout=10
                )
            else:
                print("Creating new env var")
                env_data = {
                    'key': 'QUBIC_API_KEY',
                    'value': new_token,
                    'type': 'plain',
                    'target': ['production', 'preview', 'development']
                }
                vercel_response = requests.post(
                    f'https://api.vercel.com/v9/projects/{project_id}/env',
                    headers=headers,
                    json=env_data,
                    timeout=10
                )
            
            if vercel_response.status_code not in [200, 201]:
                print(f"Error updating env var: {vercel_response.text}")
                raise Exception(f"Failed to update env var: {vercel_response.text}")
                
            print("Vercel env update successful")
            
        except requests.exceptions.RequestException as e:
            print(f"Request error: {str(e)}")
            raise Exception(f"Failed to communicate with Vercel API: {str(e)}")
        
        # 触发重新部署
        deploy_hook_url = os.getenv('VERCEL_DEPLOY_HOOK_URL')
        deployment_triggered = False
        
        if deploy_hook_url:
            print("Triggering Vercel redeployment...")
            try:
                deploy_response = requests.post(deploy_hook_url, timeout=10)
                deploy_response.raise_for_status()
                deployment_triggered = True
                print("Deployment triggered successfully")
            except requests.exceptions.RequestException as e:
                print(f"Warning: Failed to trigger deployment: {str(e)}")
        else:
            print("Warning: VERCEL_DEPLOY_HOOK_URL not set, skipping deployment")
        
        return jsonify({
            'success': True,
            'message': 'Token updated successfully',
            'token_updated': True,
            'old_token_preview': current_token[:10] + '...',
            'new_token_preview': new_token[:10] + '...',
            'deployment_triggered': deployment_triggered,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        error_message = str(e)
        print(f"Error in update_token: {error_message}")
        return jsonify({
            'success': False,
            'error': error_message,
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/network-stats/update', methods=['POST'])
def force_update_network_stats():
    """强制更新网络统计数据"""
    try:
        # 检查数据库连接
        if not check_db_connection():
            error_msg = "Database connection check failed"
            log_network_stats_event('error', error_msg)
            return jsonify({
                'status': 'error',
                'message': error_msg
            }), 500
            
        print("\n=== Starting forced network stats update ===")
        update_network_stats()
        return jsonify({
            'status': 'success',
            'message': 'Network stats update triggered'
        })
    except Exception as e:
        error_msg = f"Error triggering network stats update: {str(e)}"
        log_network_stats_event('error', error_msg)
        return jsonify({
            'status': 'error',
            'message': error_msg
        }), 500

@app.route('/api/network-stats/logs', methods=['GET'])
def get_logs():
    """获取网络统计日志"""
    try:
        # 检查数据库连接
        if not check_db_connection():
            return jsonify({
                'status': 'error',
                'message': 'Database connection check failed'
            }), 500
            
        logs = get_network_stats_logs()
        return jsonify({
            'status': 'success',
            'logs': logs
        })
    except Exception as e:
        error_msg = f"Error getting logs: {str(e)}"
        return jsonify({
            'status': 'error',
            'message': error_msg
        }), 500

# 创建定时任务
scheduler = BackgroundScheduler(timezone=pytz.UTC)

def init_jobs():
    """初始化任务"""
    try:
        print("Initializing scheduled jobs...")
        with app.app_context():
            # 立即执行一次
            update_network_stats()
        print("Initial network stats update completed")
    except Exception as e:
        print(f"Error in init_jobs: {str(e)}")

# 设置定时任务，每5分钟执行一次
scheduler.add_job(
    update_network_stats,
    'cron',
    minute='*/5',
    misfire_grace_time=30,  # 如果错过了执行时间，最多允许延迟30秒
    coalesce=True,  # 如果错过了多次执行，只执行一次
    max_instances=1  # 同一时间只允许一个实例运行
)

# 启动调度器并执行初始化
scheduler.start()
init_jobs()  # 立即执行一次初始化

if __name__ == '__main__':
    app.run(debug=False)
