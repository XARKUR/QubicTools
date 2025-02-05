import { EpochMonitor } from '@/services/epoch-monitor';

export const runtime = 'edge';
export const preferredRegion = 'sin1'; // 新加坡区域，离中国较近

// Vercel Cron Job: 每分钟运行一次
export const config = {
  maxDuration: 300, // 设置最大执行时间为 5 分钟
};

export async function GET() {
  try {
    const monitor = new EpochMonitor(process.env.GITHUB_TOKEN!);
    await monitor.checkAndUpload();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('监控出错:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
