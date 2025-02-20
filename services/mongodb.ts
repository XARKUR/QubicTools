import { MongoClient, Db } from 'mongodb';

export class MongoDB {
  private static instance: MongoDB | null = null;
  private client: MongoClient;
  private db: Db | null = null;

  private constructor() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    this.client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000, // 5 秒超时
      connectTimeoutMS: 5000
    });
  }

  public static getInstance(): MongoDB {
    if (!MongoDB.instance) {
      MongoDB.instance = new MongoDB();
    }
    return MongoDB.instance!;
  }

  async connect(): Promise<void> {
    try {
      if (!this.db) {
        await this.client.connect();
        await this.client.db('qubic_tools').command({ ping: 1 }); // 测试连接
        this.db = this.client.db('qubic_tools');
        console.log('Connected to MongoDB');
      }
    } catch (error) {
      console.error('连接 MongoDB 失败:', error);
      throw new Error(`无法连接到数据库: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.db = null;
      MongoDB.instance = null;
      console.log('Disconnected from MongoDB');
    }
  }

  static async close(): Promise<void> {
    if (MongoDB.instance) {
      await MongoDB.instance.disconnect();
    }
  }

  async saveEpochData(data: any): Promise<void> {
    try {
      if (!this.db) {
        await this.connect();
      }
      
      const collection = this.db!.collection('epoch_history');
      
      // 使用 epoch 作为唯一标识符
      await collection.updateOne(
        { epoch: data.epoch },
        { $set: data },
        { upsert: true }
      );
      
      console.log(`Saved epoch ${data.epoch} data to MongoDB`);
    } catch (error) {
      console.error('保存纪元数据失败:', error);
      throw new Error(`保存纪元数据失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getEpochData(epoch: number): Promise<any | null> {
    try {
      if (!this.db) {
        await this.connect();
      }
      
      const collection = this.db!.collection('epoch_history');
      return await collection.findOne({ epoch });
    } catch (error) {
      console.error('获取纪元数据失败:', error);
      throw new Error(`获取纪元数据失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
