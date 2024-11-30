import QubicLib from '@qubic-lib/qubic-ts-library';

// 性能监控类
class PerformanceMonitor {
  private startTime = 0;
  private attempts = 0;
  private speedHistory: number[] = [];
  private lastUpdate = 0;
  private batchSize = 1000;
  private targetSpeed = 0;
  private lastAttempts = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.startTime = Date.now();
    this.attempts = 0;
    this.lastAttempts = 0;
    this.speedHistory = [];
    this.lastUpdate = Date.now();
    this.batchSize = 1000;
    this.targetSpeed = 0;
  }

  updateMetrics(newAttempts: number) {
    const now = Date.now();
    const duration = now - this.lastUpdate;
    
    if (duration < 500) return null;
    
    const attemptsDiff = newAttempts - this.lastAttempts;
    const currentSpeed = Math.round(attemptsDiff / (duration / 1000));
    
    this.speedHistory.push(currentSpeed);
    if (this.speedHistory.length > 10) {
      this.speedHistory.shift();
    }
    
    const averageSpeed = Math.round(
      this.speedHistory.reduce((a, b) => a + b, 0) / this.speedHistory.length
    );
    
    // 动态调整批次大小
    this.adjustBatchSize(currentSpeed);
    
    this.attempts = newAttempts;
    this.lastAttempts = newAttempts;
    this.lastUpdate = now;
    
    return {
      attempts: this.attempts,
      speed: currentSpeed,
      averageSpeed,
      batchSize: this.batchSize
    };
  }

  private adjustBatchSize(currentSpeed: number) {
    if (this.speedHistory.length < 3) return;
    
    const recentAverage = this.speedHistory
      .slice(-3)
      .reduce((a, b) => a + b, 0) / 3;
    
    if (!this.targetSpeed) {
      this.targetSpeed = recentAverage;
      return;
    }
    
    // 根据性能表现动态调整批次大小
    if (recentAverage < this.targetSpeed * 0.8) {
      this.batchSize = Math.max(100, Math.floor(this.batchSize * 0.8));
    } else if (recentAverage > this.targetSpeed * 1.2) {
      this.batchSize = Math.min(10000, Math.floor(this.batchSize * 1.2));
    }
  }

  getBatchSize() {
    return this.batchSize;
  }

  getAttempts() {
    return this.attempts;
  }
}

// 工作线程状态
interface WorkerState {
  running: boolean;
  pattern: string;
  type: 'prefix' | 'suffix';
  workerId: number;
  cpuUsage: number;
  monitor: PerformanceMonitor;
  helper: any;
}

const state: WorkerState = {
  running: false,
  pattern: '',
  type: 'prefix',
  workerId: 0,
  cpuUsage: 0.8,
  monitor: new PerformanceMonitor(),
  helper: null
};

// 初始化 QubicHelper
const initHelper = async () => {
  if (state.helper) return;
  await QubicLib.crypto;
  state.helper = new QubicLib.QubicHelper();
};

// 生成地址并检查是否匹配模式
async function generateAndCheck(): Promise<{ publicId: string; privateKey: string } | null> {
  if (!state.helper) throw new Error('Helper not initialized');
  
  const seed = generateRandomSeed();
  const idPackage = await state.helper.createIdPackage(seed);
  
  const matches = state.type === 'prefix'
    ? idPackage.publicId.startsWith(state.pattern)
    : idPackage.publicId.endsWith(state.pattern);
  
  return matches ? { publicId: idPackage.publicId, privateKey: seed } : null;
}

// 生成随机种子
function generateRandomSeed(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const array = new Uint8Array(55);
  
  // 使用加密安全的随机数生成器
  crypto.getRandomValues(array);
  
  let result = '';
  for (let i = 0; i < 55; i++) {
    // 使用模运算确保均匀分布
    result += characters.charAt(array[i] % characters.length);
  }
  return result;
}

// 处理消息
self.onmessage = async (event) => {
  const { action, pattern, type, id, cpuUsage } = event.data;

  if (action === 'start') {
    state.running = true;
    state.pattern = pattern.toUpperCase();
    state.type = type;
    state.workerId = id;
    state.cpuUsage = cpuUsage;
    state.monitor.reset();
    
    try {
      await initHelper();
      await runGeneration();
    } catch (error) {
      console.error('Worker error:', error);
      self.postMessage({
        type: 'error',
        data: {
          workerId: state.workerId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  } else if (action === 'stop') {
    state.running = false;
  }
};

// 主生成循环
async function runGeneration() {
  let totalAttempts = 0;
  let lastMetricsUpdate = 0;
  
  while (state.running) {
    const batchSize = state.monitor.getBatchSize();
    const batchStart = Date.now();
    
    // 生成一批地址
    for (let i = 0; i < batchSize && state.running; i++) {
      try {
        const result = await generateAndCheck();
        totalAttempts++;
        
        if (result) {
          self.postMessage({
            type: 'success',
            data: {
              ...result,
              workerId: state.workerId,
              attempts: totalAttempts
            }
          });
          return;
        }
        
        // 定期更新性能指标
        const now = Date.now();
        if (now - lastMetricsUpdate >= 500) {
          const metrics = state.monitor.updateMetrics(totalAttempts);
          if (metrics) {
            self.postMessage({
              type: 'progress',
              data: {
                workerId: state.workerId,
                ...metrics
              }
            });
            lastMetricsUpdate = now;
          }
        }
      } catch (error) {
        console.error('Generation error:', error);
        continue;
      }
    }
    
    // CPU使用控制
    const batchDuration = Date.now() - batchStart;
    const targetDuration = batchSize / (50000 * state.cpuUsage);
    if (batchDuration < targetDuration) {
      await new Promise(resolve => 
        setTimeout(resolve, targetDuration - batchDuration)
      );
    }
  }
}