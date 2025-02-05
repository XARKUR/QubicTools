import { EpochMonitor } from '@/services/epoch-monitor';
import { QubicAPI } from '@/api/qubic';
import { NextResponse } from 'next/server';

// 新的路由段配置
export const runtime = 'edge';
export const preferredRegion = 'sin1'; // 新加坡区域，离中国较近
export const maxDuration = 300; // 设置最大执行时间为 5 分钟

export async function GET() {
  try {
    // 1. 获取当前纪元进度
    const epochProgress = await QubicAPI.getEpochProgress();
    
    // 2. 创建监控实例
    const monitor = new EpochMonitor(process.env.GITHUB_TOKEN!);
    
    // 3. 检查并上传
    const result = await monitor.checkAndUpload();
    
    return NextResponse.json({ 
      success: true,
      currentEpoch: result.currentEpoch,
      epochProgress: epochProgress.toFixed(2) + '%',
      checkThreshold: '99.99%',
      timestamp: new Date().toISOString(),
      status: result.status
    });
  } catch (error) {
    console.error('监控出错:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
