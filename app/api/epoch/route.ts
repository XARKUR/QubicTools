import { NextResponse } from 'next/server';
import { MongoDB } from '@/services/mongodb';
import { EpochMonitor } from '@/services/epoch-monitor';
import { QubicAPI } from '@/api/qubic';

export async function GET() {
  const mongodb = MongoDB.getInstance();
  
  try {
    console.log('\n[API] 开始处理请求:', new Date().toISOString());
    
    // 1. 获取当前纪元进度
    const epochProgress = await QubicAPI.getEpochProgress();
    console.log('[API] 纪元进度:', epochProgress);
    
    // 2. 创建监控实例
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN not found');
    }
    const monitor = new EpochMonitor(process.env.GITHUB_TOKEN);
    
    // 3. 检查并上传
    console.log('[API] 开始检查和上传...');
    const result = await monitor.checkAndUpload();
    console.log('[API] 检查结果:', result);
    
    const response = { 
      success: true,
      currentEpoch: result.currentEpoch,
      epochProgress: epochProgress.toFixed(2) + '%',
      checkThreshold: '99.90%',
      timestamp: new Date().toISOString(),
      status: result.status
    };
    
    console.log('[API] 返回数据:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('监控出错:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('错误详情:', errorMessage);
    return NextResponse.json({ 
      success: false, 
      error: errorMessage
    }, { status: 500 });
  } finally {
    try {
      // 确保关闭 MongoDB 连接
      await mongodb.disconnect();
    } catch (closeError) {
      console.error('关闭 MongoDB 连接出错:', closeError);
    }
  }
}
