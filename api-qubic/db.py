from pymongo import MongoClient
from config import MONGODB_URI

# MongoDB连接
mongo_client = MongoClient(MONGODB_URI)
