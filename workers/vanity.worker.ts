import QubicLib from '@qubic-lib/qubic-ts-library';

class PerformanceMonitor {
  private startTime = 0;
  private attempts = 0;
  private speedHistory: number[] = [];
  private lastUpdate = 0;
  private batchSize = 1000;
  private targetSpeed = 0;
  private lastAttempts = 0;
  private readonly maxHistoryLength = 5;  // 减少历史记录长度
  private gcCounter = 0;
  private objectsCreated = 0;
  private readonly maxObjectsBeforeGC = 1000; // 新增：对象数量阈值

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
    this.gcCounter = 0;
    this.objectsCreated = 0;
  }

  trackObject() {
    this.objectsCreated++;
    // 当创建的对象数量超过阈值时，建议进行GC
    if (this.objectsCreated >= this.maxObjectsBeforeGC) {
      this.objectsCreated = 0;
      return true; // 返回true表示建议进行GC
    }
    return false;
  }

  getStats() {
    const stats = {
      objectsCreated: this.objectsCreated,
      uptime: Date.now() - this.startTime
    };
    return stats;
  }

  updateMetrics(newAttempts: number) {
    const now = Date.now();
    const duration = now - this.lastUpdate;
    
    if (duration < 500) return null;
    
    const attemptsDiff = newAttempts - this.lastAttempts;
    const currentSpeed = Math.round(attemptsDiff / (duration / 1000));
    
    // 使用固定大小的循环缓冲区，减少历史记录长度
    if (this.speedHistory.length >= this.maxHistoryLength) {
      this.speedHistory.shift();
    }
    this.speedHistory.push(currentSpeed);
    
    // 只保留最近几个值计算平均值
    const recentHistory = this.speedHistory.slice(-3);
    const averageSpeed = Math.round(
      recentHistory.reduce((a, b) => a + b, 0) / recentHistory.length
    );
    
    this.attempts = newAttempts;
    this.lastAttempts = newAttempts;
    this.lastUpdate = now;

    // 每500次更新触发一次主动清理（比之前更频繁）
    this.gcCounter++;
    if (this.gcCounter >= 500) {
      this.gcCounter = 0;
      this.objectsCreated = 0;
    }
    
    const metrics = {
      attempts: this.attempts,
      speed: currentSpeed,
      averageSpeed,
      batchSize: this.batchSize,
      ...this.getStats()
    };

    // 清理不需要的引用
    return { ...metrics };
  }

  private adjustBatchSize(currentSpeed: number) {
    if (this.speedHistory.length < 2) return;
    
    const recentAverage = this.speedHistory
      .slice(-2)  // 只使用最近的2个值
      .reduce((a, b) => a + b, 0) / 2;
    
    if (!this.targetSpeed) {
      this.targetSpeed = recentAverage;
      return;
    }
    
    // 更保守的批量大小调整
    if (recentAverage < this.targetSpeed * 0.9) {
      this.batchSize = Math.max(100, Math.floor(this.batchSize * 0.9));
    } else if (recentAverage > this.targetSpeed * 1.1) {
      this.batchSize = Math.min(5000, Math.floor(this.batchSize * 1.1));
    }
  }

  setBatchSize(size: number) {
    this.batchSize = Math.max(100, Math.min(5000, size));
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
  let result = null;
  
  try {
    seed = generateRandomSeed();
    state.monitor.trackObject();
    
    idPackage = await state.helper.createIdPackage(seed);
    state.monitor.trackObject();
    
    // 对于前缀匹配使用原始公钥（大写），对于后缀匹配将公钥转换为小写
    const publicId = state.type === 'prefix' ? idPackage.publicId : idPackage.publicId.toLowerCase();
    const matches = state.type === 'prefix'
      ? publicId.startsWith(state.pattern)
      : publicId.endsWith(state.pattern);
    
    if (matches) {
      result = { 
        publicId: idPackage.publicId,
        privateKey: seed 
      };
      state.monitor.trackObject();
    }
    
    return result;
  } catch (error) {
    console.error('Generate and check error:', error);
    return null;
  } finally {
    // 确保清理所有敏感数据
    try {
      if (seed) {
        secureCleanup({ seed });
        seed = null;
      }
      if (idPackage) {
        secureCleanup(idPackage);
        idPackage = null;
      }
      // 主动触发小范围GC
      if (globalThis.gc) {
        globalThis.gc();
      }
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
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
    console.log('Worker received start command:', {
      pattern,
      type,
      id,
      originalCpuUsage: cpuUsage,
    });

    state.running = true;
    // 对于前缀匹配使用大写，对于后缀匹配保持原样
    state.pattern = type === 'prefix' ? pattern.toUpperCase() : pattern.toLowerCase();
    state.type = type;
    state.workerId = id;
    state.cpuUsage = cpuUsage / 100;
    state.monitor.reset();
    
    // 设置初始批处理大小
    const initialBatchSize = Math.floor(100 + (4900 * state.cpuUsage));
    state.monitor.setBatchSize(initialBatchSize);
    
    console.log('Worker initialized with:', {
      convertedCpuUsage: state.cpuUsage,
      initialBatchSize,
    });
    
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
    console.log('Worker received stop command');
    state.running = false;
  }
};

async function runGeneration() {
  let totalAttempts = 0;
  let lastMetricsUpdate = 0;
  let lastPerformanceLog = 0;
  let lastGC = Date.now();
  let lastHeartbeat = Date.now();
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;
  const HEARTBEAT_INTERVAL = 30000; // 30秒发送一次心跳
  const FORCE_GC_INTERVAL = 5000;   // 降低到5秒强制GC一次
  const METRICS_INTERVAL = 500;     // 500ms更新一次指标
  const BATCH_SIZE = 100;          // 限制批处理大小

  try {
    while (state.running) {
      const cycleStart = Date.now();
      let batchAttempts = 0;
      
      // 减少工作时间窗口到50ms，提高响应性和内存释放频率
      const timeWindow = 50;
      const workTime = Math.floor(timeWindow * state.cpuUsage);
      const workDeadline = cycleStart + workTime;
      
      // 在分配的工作时间内执行计算
      while (Date.now() < workDeadline && state.running && batchAttempts < BATCH_SIZE) {
        try {
          const result = await generateAndCheck();
          totalAttempts++;
          batchAttempts++;
          consecutiveErrors = 0;
          
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
          
          // 更频繁的内存清理
          if (now - lastGC >= FORCE_GC_INTERVAL) {
            // 清理临时对象
            secureCleanup({ temp: generateRandomSeed() });
            // 重置性能监视器
            state.monitor.reset();
            // 主动请求垃圾回收
            if (globalThis.gc) {
              try {
                globalThis.gc();
              } catch (e) {
                console.warn('GC not available:', e);
              }
            }
            lastGC = now;
          }
          
          // 定期发送心跳
          if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
            self.postMessage({
              type: 'heartbeat',
              data: {
                workerId: state.workerId,
                timestamp: now
              }
            });
            lastHeartbeat = now;
          }
          
          // 更新指标
          if (now - lastMetricsUpdate >= METRICS_INTERVAL) {
            const metrics = state.monitor.updateMetrics(totalAttempts);
            if (metrics) {
              self.postMessage({
                type: 'progress',
                data: {
                  workerId: state.workerId,
                  ...metrics,
                  memoryUsage: process.memoryUsage?.() || {},
                  timestamp: now
                }
              });
              lastMetricsUpdate = now;
            }
          }
        } catch (error) {
          consecutiveErrors++;
          console.error('Generation error:', error);
          
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Unknown error occurred';
            throw new Error(`Too many consecutive errors: ${errorMessage}`);
          }
          
          // 发生错误时立即进行清理
          secureCleanup({ temp: generateRandomSeed() });
          if (globalThis.gc) {
            globalThis.gc();
          }
          
          // 短暂暂停让系统有时间恢复
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // 每个批次后强制暂停一小段时间，让系统有机会进行内存整理
      await new Promise(resolve => setTimeout(resolve, 5));
    }
  } finally {
    // 确保在退出时清理
    try {
      state.monitor.reset();
      if (globalThis.gc) {
        globalThis.gc();
      }
    } catch (error) {
      console.warn('Final cleanup error:', error);
    }
  }
}

// 增强 Worker 终止时的清理
self.addEventListener('unload', () => {
  try {
    console.log('Worker unloading, cleaning up...');
    // 通知主线程 worker 即将终止
    self.postMessage({
      type: 'terminating',
      data: {
        workerId: state.workerId,
        timestamp: Date.now()
      }
    });
    
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
    
    // 尝试主动触发垃圾回收
    if (globalThis.gc) {
      try {
        globalThis.gc();
      } catch (e) {
        console.warn('Final GC failed:', e);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

// 添加错误处理
self.addEventListener('error', (event) => {
  console.error('Worker global error:', event.error);
  // 尝试通知主线程
  try {
    self.postMessage({
      type: 'error',
      data: {
        workerId: state.workerId,
        error: event.error?.message || 'Unknown global error'
      }
    });
  } catch (e) {
    console.error('Failed to notify main thread of error:', e);
  }
});