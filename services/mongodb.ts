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
    this.client = new MongoClient(uri);
  }

  public static getInstance(): MongoDB {
    if (!MongoDB.instance) {
      MongoDB.instance = new MongoDB();
    }
    return MongoDB.instance!;
  }

  async connect(): Promise<void> {
    if (!this.db) {
      await this.client.connect();
      this.db = this.client.db('qubic_tools');
      console.log('Connected to MongoDB');
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
  }

  async getEpochData(epoch: number): Promise<any | null> {
    if (!this.db) {
      await this.connect();
    }
    
    const collection = this.db!.collection('epoch_history');
    return await collection.findOne({ epoch });
  }
}
