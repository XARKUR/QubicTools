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
    await monitor.checkAndUpload();
    
    return NextResponse.json({ 
      success: true,
      epochProgress: epochProgress.toFixed(2) + '%',
      checkThreshold: '94%',
      timestamp: new Date().toISOString(),
      message: epochProgress >= 94 ? '已达到检查阈值，正在处理数据' : '未达到检查阈值，跳过处理'
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
