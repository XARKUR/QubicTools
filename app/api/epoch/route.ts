import { EpochMonitor } from '@/services/epoch-monitor';
import { QubicAPI } from '@/api/qubic';
import { NextResponse } from 'next/server';

// 新的路由段配置
export const runtime = 'edge';
export const preferredRegion = 'sin1'; // 新加坡区域，离中国较近
export const maxDuration = 300; // 设置最大执行时间为 5 分钟

export async function GET() {
  try {
    console.log('\n[API] 开始处理请求:', new Date().toISOString());
    
    // 1. 获取当前纪元进度
    const epochProgress = await QubicAPI.getEpochProgress();
    console.log('[API] 纪元进度:', epochProgress);
    
    // 2. 创建监控实例
    const monitor = new EpochMonitor(process.env.GITHUB_TOKEN!);
    
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
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
