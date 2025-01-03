from datetime import datetime, timedelta
import pytz
from db import mongo_client
from config import DB_NAME, COLLECTION_NAME

# 获取数据库集合
db = mongo_client.get_database(DB_NAME)
network_stats = db.get_collection(COLLECTION_NAME)
network_stats_logs = db.get_collection(f"{COLLECTION_NAME}_logs")

def log_network_stats_event(event_type, message, data=None):
    """记录网络统计事件
    Args:
        event_type: 事件类型 (例如: 'skip', 'validation', 'error')
        message: 事件描述
        data: 相关数据 (可选)
    """
    try:
        current_time = datetime.now(pytz.UTC)
        
        # 计算当前周期的开始时间
        current_weekday = current_time.weekday()
        days_since_wednesday = (current_weekday - 2) % 7
        period_start = current_time - timedelta(days=days_since_wednesday)
        period_start = period_start.replace(hour=12, minute=0, second=0, microsecond=0)
        
        if current_time < period_start:
            period_start -= timedelta(days=7)
            
        # 检查是否需要清理旧日志
        last_log = network_stats_logs.find_one(sort=[('timestamp', -1)])
        if last_log and last_log.get('period_start'):
            latest_period_start = last_log['period_start']
            if latest_period_start.tzinfo is None:
                latest_period_start = pytz.UTC.localize(latest_period_start)
            if period_start > latest_period_start:
                old_logs = network_stats_logs.delete_many({
                    'timestamp': {'$lt': latest_period_start}
                })
                print(f"Cleaned up {old_logs.deleted_count} old log entries")
        
        # 创建日志记录
        log_entry = {
            'timestamp': current_time,
            'period_start': period_start,
            'event_type': event_type,
            'message': message
        }
        
        if data:
            log_entry['data'] = data
            
        network_stats_logs.insert_one(log_entry)
        
    except Exception as e:
        print(f"Error logging network stats event: {str(e)}")

def is_valid_hashrate(current_value, previous_values, threshold=0.5):
    """检查算力值是否有效
    Args:
        current_value: 当前算力值
        previous_values: 之前的算力值列表
        threshold: 允许的最大变化比例（默认50%）
    """
    if not previous_values:
        return True
    
    # 如果只有一个历史值，直接和它比较
    if len(previous_values) == 1:
        prev_value = previous_values[0]
        if prev_value == 0:
            return True
        change_ratio = abs(current_value - prev_value) / prev_value
        return change_ratio <= threshold
    
    # 计算移动平均值，排除异常值
    sorted_values = sorted(previous_values)
    if len(sorted_values) >= 3:
        # 去掉最高和最低值
        values_for_avg = sorted_values[1:-1]
    else:
        values_for_avg = sorted_values
    
    avg = sum(values_for_avg) / len(values_for_avg)
    if avg == 0:
        return True
    
    # 计算变化比例
    change_ratio = abs(current_value - avg) / avg
    return change_ratio <= threshold

def calculate_network_stats(tool_data):
    """计算并存储网络统计数据
    Args:
        tool_data: 从 /api/qubic/tool 获取的数据
    """
    try:
        current_time = datetime.now(pytz.UTC)
        print(f"\n=== Starting network stats calculation at {current_time} ===")
        
        # 获取最近的一条记录
        last_record = network_stats.find_one(sort=[('timestamp', -1)])
        
        # 检查记录间隔（至少5分钟）
        if last_record:
            last_time = last_record.get('timestamp')
            # 确保last_time有时区信息
            if last_time.tzinfo is None:
                last_time = pytz.UTC.localize(last_time)
            time_diff = (current_time - last_time).total_seconds()
            
            if time_diff < 300:  # 5分钟
                log_network_stats_event('skip', f"Only {time_diff:.1f} seconds since last record")
                print(f"Only {time_diff:.1f} seconds since last record, skipping")
                return
        
        # 获取 idle 状态
        is_idle = tool_data.get('data', {}).get('idle', False)
        print(f"Current idle status: {is_idle}")
        
        # 如果当前是 idle 状态，直接跳过
        if is_idle:
            log_network_stats_event('skip', f"Mining is idle at {current_time}")
            print(f"Mining is idle at {current_time}, skipping record")
            return
            
        # 如果从idle恢复，检查恢复时间
        if last_record and last_record.get('was_idle', False):
            recovery_time = (current_time - last_time).total_seconds()
            required_wait_time = 300  # 等待5分钟
            if recovery_time < required_wait_time:
                log_network_stats_event('skip', f"Only {recovery_time:.1f} seconds since idle recovery")
                print(f"Only {recovery_time:.1f} seconds since idle recovery, waiting for {required_wait_time} seconds")
                return
            print(f"Waited {recovery_time:.1f} seconds after idle recovery, proceeding")
        
        # 从tool_data获取算力数据
        pool_hashrate = tool_data.get('data', {}).get('pool_hashrate', {})
        current_hashrates = pool_hashrate.get('current', {})
        
        # 获取修正后的算力数据
        apool_data = tool_data.get('data', {}).get('apool', {})
        solutions_data = tool_data.get('data', {}).get('solutions', {})
        minerlab_data = tool_data.get('data', {}).get('minerlab', {})
        nevermine_data = tool_data.get('data', {}).get('nevermine', {})  # 添加 Nevermine 数据
        
        estimated_its = float(current_hashrates.get('qli_hashrate', 0))
        apool_hashrate = float(apool_data.get('corrected_hashrate', 0))
        solutions_hashrate = float(solutions_data.get('corrected_hashrate', 0))
        minerlab_hashrate = float(minerlab_data.get('corrected_hashrate', 0))
        nevermine_hashrate = float(nevermine_data.get('corrected_hashrate', 0))  # 添加 Nevermine 算力
        
        hashrate_data = {
            'qli': estimated_its,
            'apool': apool_hashrate,
            'solutions': solutions_hashrate,
            'minerlab': minerlab_hashrate,
            'nevermine': nevermine_hashrate  # 添加 Nevermine 算力
        }
        
        # 验证算力数据
        validation_results = {
            'qli': True,
            'apool': True,
            'solutions': True,
            'minerlab': True,
            'nevermine': True  # 添加 Nevermine 验证结果
        }
        
        # 检查QLI算力
        if estimated_its <= 0:
            log_network_stats_event('warning', "QLI hashrate is non-positive")
            print("Warning: QLI hashrate is non-positive")
            validation_results['qli'] = False
            
            # 使用历史QLI算力
            recent_records = list(network_stats.find(
                {'qli_hashrate': {'$gt': 0}},
                {'qli_hashrate': 1}
            ).sort('timestamp', -1).limit(5))
            
            if recent_records:
                estimated_its = sum(r['qli_hashrate'] for r in recent_records) / len(recent_records)
                log_network_stats_event('info', f"Using average of last {len(recent_records)} records for QLI")
                print(f"Using average of last {len(recent_records)} records for QLI: {estimated_its}")
                validation_results['qli'] = True
        
        # 检查矿池算力
        if (apool_hashrate <= 0 or solutions_hashrate <= 0 or 
            minerlab_hashrate <= 0 or nevermine_hashrate <= 0):  # 添加 Nevermine 检查
            log_network_stats_event('warning', "Some pool hashrate is non-positive", hashrate_data)
            print(f"Warning: Some pool hashrate is non-positive: {hashrate_data}")
            if apool_hashrate <= 0:
                validation_results['apool'] = False
            if solutions_hashrate <= 0:
                validation_results['solutions'] = False
            if minerlab_hashrate <= 0:
                validation_results['minerlab'] = False
            if nevermine_hashrate <= 0:
                validation_results['nevermine'] = False
        
        # 如果任何验证失败，跳过记录
        if not all(validation_results.values()):
            log_network_stats_event('validation', "Skipping record with abnormal values", {
                'hashrates': hashrate_data,
                'validation_results': validation_results
            })
            print("Skipping record due to validation failures")
            return
        
        # 计算当前周期的开始时间
        current_weekday = current_time.weekday()
        days_since_wednesday = (current_weekday - 2) % 7
        period_start = current_time - timedelta(days=days_since_wednesday)
        period_start = period_start.replace(hour=12, minute=0, second=0, microsecond=0)
        
        if current_time < period_start:
            period_start -= timedelta(days=7)
            
        # 检查是否需要清理旧记录
        if last_record and last_record.get('period_start'):
            latest_period_start = last_record['period_start']
            if latest_period_start.tzinfo is None:
                latest_period_start = pytz.UTC.localize(latest_period_start)
            
            if period_start > latest_period_start:
                # 新周期开始，清理旧记录
                old_records = network_stats.delete_many({
                    'timestamp': {'$lt': latest_period_start}
                })
                print(f"New period started, deleted {old_records.deleted_count} old records")
        
        # 保存记录
        record = {
            'timestamp': current_time,
            'period_start': period_start,
            'qli_hashrate': estimated_its,
            'apool_hashrate': apool_hashrate,
            'solutions_hashrate': solutions_hashrate,
            'minerlab_hashrate': minerlab_hashrate,
            'nevermine_hashrate': nevermine_hashrate,  # 添加 Nevermine 算力
            'was_idle': is_idle
        }
        
        network_stats.insert_one(record)
        log_network_stats_event('success', "Successfully recorded network stats", {
            'hashrates': hashrate_data,
            'validation_results': validation_results
        })
        print(f"\nSuccessfully recorded network stats with values:")
        print(f"qli={estimated_its}, apool={apool_hashrate}, solutions={solutions_hashrate}, minerlab={minerlab_hashrate}, nevermine={nevermine_hashrate}")
        
    except Exception as e:
        error_msg = f"Error calculating network stats: {str(e)}"
        log_network_stats_event('error', error_msg)
        print(error_msg)

def get_network_stats_data():
    """获取网络统计数据"""
    try:
        # 获取当前周期的开始时间
        current_time = datetime.now(pytz.UTC)
        current_weekday = current_time.weekday()
        days_since_wednesday = (current_weekday - 2) % 7
        period_start = current_time - timedelta(days=days_since_wednesday)
        period_start = period_start.replace(hour=12, minute=0, second=0, microsecond=0)
        
        if current_time < period_start:
            period_start -= timedelta(days=7)
        
        print(f"\nCalculating averages for period starting from: {period_start}")
        
        # 获取当前周期的所有记录
        records = list(network_stats.find({
            'timestamp': {'$gte': period_start}
        }).sort('timestamp', 1))
        
        if not records:
            print("No records found in the current period")
            return None
        
        # 使用滑动窗口进行数据验证
        window_size = 5
        valid_records = []
        
        for i, record in enumerate(records):
            if i < window_size - 1:
                valid_records.append(record)
                continue
            
            # 获取前几条记录的数据用于验证
            window = records[i-window_size+1:i+1]
            
            # 检查每个矿池的算力值
            qli_values = [r['qli_hashrate'] for r in window]
            apool_values = [r['apool_hashrate'] for r in window]
            solutions_values = [r['solutions_hashrate'] for r in window]
            minerlab_values = [r['minerlab_hashrate'] for r in window]
            nevermine_values = [r.get('nevermine_hashrate', 0) for r in window]  # 添加 Nevermine 算力
            
            # 如果所有值都通过验证，则添加到有效记录中
            if (is_valid_hashrate(record['qli_hashrate'], qli_values[:-1]) and
                is_valid_hashrate(record['apool_hashrate'], apool_values[:-1]) and
                is_valid_hashrate(record['solutions_hashrate'], solutions_values[:-1]) and
                is_valid_hashrate(record['minerlab_hashrate'], minerlab_values[:-1]) and
                is_valid_hashrate(record.get('nevermine_hashrate', 0), nevermine_values[:-1])):  # 添加 Nevermine 验证
                valid_records.append(record)
        
        if not valid_records:
            print("No valid records found after validation")
            return None
        
        # 计算平均值
        total_qli = sum(record['qli_hashrate'] for record in valid_records)
        total_apool = sum(record['apool_hashrate'] for record in valid_records)
        total_solutions = sum(record['solutions_hashrate'] for record in valid_records)
        total_minerlab = sum(record['minerlab_hashrate'] for record in valid_records)
        total_nevermine = sum(record.get('nevermine_hashrate', 0) for record in valid_records)  # 添加 Nevermine 算力
        record_count = len(valid_records)
        
        averages = {
            'average_qli_hashrate': total_qli / record_count if record_count > 0 else 0,
            'average_apool_hashrate': total_apool / record_count if record_count > 0 else 0,
            'average_solutions_hashrate': total_solutions / record_count if record_count > 0 else 0,
            'average_minerlab_hashrate': total_minerlab / record_count if record_count > 0 else 0,
            'average_nevermine_hashrate': total_nevermine / record_count if record_count > 0 else 0  # 添加 Nevermine 算力
        }
        
        print(f"Calculated averages from {record_count} valid records")
        
        return {
            'averages': averages,
            'record_count': record_count,  # 添加记录数
            'period_start': period_start.isoformat()
        }
        
    except Exception as e:
        print(f"Error in get_network_stats_data: {str(e)}")
        return None

def get_network_stats_logs(limit=100):
    """获取最近的网络统计日志"""
    try:
        db = mongo_client[DB_NAME]
        collection = db[f"{COLLECTION_NAME}_logs"]
        
        # 获取最近的日志记录
        logs = list(collection.find(
            {},
            {'_id': 0}  # 不返回_id字段
        ).sort('timestamp', -1).limit(limit))
        
        # 转换时间戳为ISO格式字符串
        for log in logs:
            if 'timestamp' in log:
                log['timestamp'] = log['timestamp'].isoformat()
            if 'period_start' in log:
                log['period_start'] = log['period_start'].isoformat()
                
        return logs
    except Exception as e:
        print(f"Error getting logs: {str(e)}")
        return []

def check_db_connection():
    """检查数据库连接状态"""
    try:
        # 尝试ping数据库
        mongo_client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        return True
    except Exception as e:
        error_msg = f"Failed to connect to MongoDB: {str(e)}"
        print(error_msg)
        return False
