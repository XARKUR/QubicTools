import { EpochMonitor } from '@/services/epoch-monitor';
import { QubicAPI } from '@/api/qubic';
import { NextResponse } from 'next/server';
import type { QubicToolResponse } from '@/types/api';

// 新的路由段配置
export const runtime = 'edge';
export const preferredRegion = 'sin1'; // 新加坡区域，离中国较近
export const maxDuration = 300; // 设置最大执行时间为 5 分钟

export async function GET() {
  try {
    // 直接从 API 获取数据
    const response = await fetch('https://api-qubic.vercel.app/api/qubic/tool');
    const data = await response.json();
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        currentEpoch: data.data.currentEpoch,
        epochProgress: (data.data.solutionsPerHour / data.data.solutionsPerHourCalculated * 100).toFixed(2) + '%',
        checkThreshold: '99.90%',
        timestamp: new Date().toISOString(),
        status: '等待进度达到99.90%'
      }),
      {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'pragma': 'no-cache',
          'expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('监控出错:', error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'pragma': 'no-cache',
          'expires': '0',
        },
      }
    );
  }
}
