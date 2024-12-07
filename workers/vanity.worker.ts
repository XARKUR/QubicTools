import QubicLib from '@qubic-lib/qubic-ts-library';

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

const initHelper = async () => {
  if (state.helper) return;
  await QubicLib.crypto;
  state.helper = new QubicLib.QubicHelper();
};

// 安全清理函数
function secureCleanup(obj: any) {
  if (!obj) return;
  
  // 遍历对象的所有属性
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // 多次覆写字符串内容
      const len = obj[key].length;
      for (let i = 0; i < 3; i++) {
        obj[key] = crypto.getRandomValues(new Uint8Array(len * 2))
          .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
      }
      obj[key] = '';
    } else if (typeof obj[key] === 'object') {
      secureCleanup(obj[key]);
    }
  }
  
  // 将对象的所有属性设置为 null
  for (const key in obj) {
    obj[key] = null;
  }
}

async function generateAndCheck(): Promise<{ publicId: string; privateKey: string } | null> {
  if (!state.helper) throw new Error('Helper not initialized');
  
  let seed = null;
  let idPackage = null;
  
  try {
    seed = generateRandomSeed();
    idPackage = await state.helper.createIdPackage(seed);
    
    const matches = state.type === 'prefix'
      ? idPackage.publicId.startsWith(state.pattern)
      : idPackage.publicId.endsWith(state.pattern);
    
    if (matches) {
      const result = { 
        publicId: idPackage.publicId, 
        privateKey: seed 
      };
      
      // 立即清理原始数据
      secureCleanup(idPackage);
      return result;
    }
    
    return null;
  } finally {
    // 确保清理所有敏感数据
    if (seed) {
      secureCleanup({ seed });
    }
    if (idPackage) {
      secureCleanup(idPackage);
    }
  }
}

function generateRandomSeed(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const array = new Uint8Array(55);
  
  crypto.getRandomValues(array);
  
  let result = '';
  for (let i = 0; i < 55; i++) {
    result += characters.charAt(array[i] % characters.length);
  }
  return result;
}

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

async function runGeneration() {
  let totalAttempts = 0;
  let lastMetricsUpdate = 0;
  
  while (state.running) {
    const batchSize = state.monitor.getBatchSize();
    const batchStart = Date.now();
    
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
    
    const batchDuration = Date.now() - batchStart;
    const targetDuration = batchSize / (50000 * state.cpuUsage);
    if (batchDuration < targetDuration) {
      await new Promise(resolve => 
        setTimeout(resolve, targetDuration - batchDuration)
      );
    }
  }
}

// 增强 Worker 终止时的清理
self.addEventListener('unload', () => {
  try {
    // 停止所有正在进行的操作
    state.running = false;
    
    // 清理性能监控数据
    state.monitor.reset();
    
    // 安全清理所有状态数据
    secureCleanup(state.helper);
    state.helper = null;
    
    // 清理其他状态数据
    state.pattern = '';
    state.type = 'prefix';
    state.workerId = 0;
    state.cpuUsage = 0;
    
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});