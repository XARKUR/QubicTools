from dotenv import load_dotenv
import os

# 加载环境变量
load_dotenv()

# MongoDB配置
MONGODB_URI = os.getenv('')
DB_NAME = 'qubic'
COLLECTION_NAME = 'network_stats'

# API配置
QUBIC_API_KEY = os.getenv('QUBIC_API_KEY')
QUBIC_USERNAME = os.getenv('QUBIC_USERNAME', 'guest@qubic.li')
QUBIC_PASSWORD = os.getenv('QUBIC_PASSWORD', 'guest13@Qubic.li')

# Vercel配置
VERCEL_PROJECT_ID = os.getenv('VERCEL_PROJECT_ID', '')
VERCEL_TOKEN = os.getenv('VERCEL_TOKEN', '')

# 缓存配置
CACHE_DURATION = 300  # 5分钟缓存

# API URLs
QUBIC_API_BASE = 'https://api.qubic.li'
APOOL_API_BASE = 'https://client.apool.io'
SOLUTIONS_API_BASE = 'https://pool.qubic.solutions'
MINERLAB_API_BASE = 'https://minerlab-qubic.azure-api.net/rest/v1'
NEVERMINE_API_BASE = 'https://qubic.nevermine.io'
EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD'

# CORS配置
CORS_ORIGINS = [
    'https://tool.qubic.site',  # 生产环境域名
    'https://qubic-tools.vercel.app',  # 测试环境域名
    'http://localhost:3000',       # 本地开发环境
    'http://127.0.0.1:3000'       # 本地开发环境
]

# CORS配置选项
CORS_OPTIONS = {
    'origins': CORS_ORIGINS,
    'methods': ['GET', 'POST', 'OPTIONS'],
    'allow_headers': ['Content-Type', 'Authorization'],
    'expose_headers': ['Content-Range', 'X-Total-Count'],
    'supports_credentials': True,
    'max_age': 600,  # 预检请求缓存时间（秒）
}

# Headers配置
DEFAULT_HEADERS = {
    'authority': 'api.qubic.li',
    'accept': 'application/json',
    'accept-language': 'zh-CN,zh;q=0.9',
    'content-type': 'application/json-patch+json',
    'origin': 'https://app.qubic.li',
    'referer': 'https://app.qubic.li/',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Linux"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
}
