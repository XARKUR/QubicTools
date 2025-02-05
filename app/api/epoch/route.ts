import { EpochMonitor } from '@/services/epoch-monitor';

import { NextResponse } from 'next/server';

// 新的路由段配置
export const runtime = 'edge';
export const preferredRegion = 'sin1'; // 新加坡区域，离中国较近
export const maxDuration = 300; // 设置最大执行时间为 5 分钟

export async function GET() {
  try {
    const monitor = new EpochMonitor(process.env.GITHUB_TOKEN!);
    await monitor.checkAndUpload();
    return NextResponse.json({ success: true });
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
