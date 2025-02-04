import { EventEmitter } from 'events';

interface WorkerMessage {
  type: string;
  data: any;
}

interface WorkerMetrics {
  attempts: number;
  speed: number;
  averageSpeed: number;
  memoryUsage: any;
  timestamp: number;
}

interface WorkerState {
  id: number;
  worker: Worker;
  lastHeartbeat: number;
  metrics: WorkerMetrics | null;
  status: 'running' | 'paused' | 'error' | 'terminated';
  errors: number;
}

export class VanityWorkerManager extends EventEmitter {
  private workers: Map<number, WorkerState> = new Map();
  private pattern: string = '';
  private patternType: 'prefix' | 'suffix' = 'prefix';
  private cpuUsage: number = 55;
  private isRunning: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private readonly MAX_WORKERS = navigator.hardwareConcurrency || 4;
  private readonly HEARTBEAT_TIMEOUT = 35000; // 35秒没有心跳就重启
  private readonly METRICS_INTERVAL = 1000; // 每秒更新一次指标
  private readonly MAX_WORKER_ERRORS = 3; // 最大错误次数

  constructor() {
    super();
    this.setupIntervals();
  }

  private setupIntervals() {
    // 心跳检查
    this.heartbeatInterval = setInterval(() => {
      this.checkWorkers();
    }, 5000);

    // 指标汇总
    this.metricsInterval = setInterval(() => {
      this.aggregateMetrics();
    }, this.METRICS_INTERVAL);
  }

  private aggregateMetrics() {
    if (!this.isRunning) return;

    let totalAttempts = 0;
    let totalSpeed = 0;
    let activeWorkers = 0;

    this.workers.forEach(state => {
      if (state.status === 'running' && state.metrics) {
        totalAttempts += state.metrics.attempts;
        totalSpeed += state.metrics.speed;
        activeWorkers++;
      }
    });

    this.emit('metrics', {
      totalAttempts,
      averageSpeed: activeWorkers ? totalSpeed / activeWorkers : 0,
      activeWorkers,
      totalWorkers: this.workers.size
    });
  }

  private checkWorkers() {
    if (!this.isRunning) return;

    const now = Date.now();
    this.workers.forEach((state, id) => {
      // 检查心跳超时
      if (now - state.lastHeartbeat > this.HEARTBEAT_TIMEOUT) {
        console.warn(`Worker ${id} heartbeat timeout, restarting...`);
        this.restartWorker(id);
      }
    });
  }

  private createWorker(id: number): Worker {
    const worker = new Worker(new URL('../../workers/vanity.worker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      this.handleWorkerMessage(id, event.data);
    };

    worker.onerror = (error) => {
      console.error(`Worker ${id} error:`, error);
      this.handleWorkerError(id);
    };

    this.workers.set(id, {
      id,
      worker,
      lastHeartbeat: Date.now(),
      metrics: null,
      status: 'running',
      errors: 0
    });

    // 启动worker
    worker.postMessage({
      action: 'start',
      pattern: this.pattern,
      type: this.patternType,
      id,
      cpuUsage: this.cpuUsage
    });

    return worker;
  }

  private handleWorkerMessage(workerId: number, message: WorkerMessage) {
    const state = this.workers.get(workerId);
    if (!state) return;

    switch (message.type) {
      case 'heartbeat':
        state.lastHeartbeat = message.data.timestamp;
        state.status = 'running';
        break;

      case 'progress':
        state.metrics = message.data;
        state.lastHeartbeat = message.data.timestamp;
        break;

      case 'success':
        this.emit('success', message.data);
        this.stop();
        break;

      case 'warning':
        console.warn(`Worker ${workerId} warning:`, message.data);
        state.status = 'paused';
        break;

      case 'error':
        console.error(`Worker ${workerId} error:`, message.data);
        this.handleWorkerError(workerId);
        break;

      case 'terminating':
        console.log(`Worker ${workerId} terminating:`, message.data);
        this.restartWorker(workerId);
        break;

      case 'performance':
        // 可以用来调整worker的性能参数
        break;
    }
  }

  private handleWorkerError(workerId: number) {
    const state = this.workers.get(workerId);
    if (!state) return;

    state.errors++;
    state.status = 'error';

    if (state.errors >= this.MAX_WORKER_ERRORS) {
      console.warn(`Worker ${workerId} reached max errors, restarting...`);
      this.restartWorker(workerId);
    }
  }

  private restartWorker(workerId: number) {
    const state = this.workers.get(workerId);
    if (!state || !this.isRunning) return;

    try {
      state.worker.terminate();
    } catch (error) {
      console.error(`Error terminating worker ${workerId}:`, error);
    }

    if (this.isRunning) {
      setTimeout(() => {
        this.createWorker(workerId);
      }, 1000);
    }
  }

  start(pattern: string, patternType: 'prefix' | 'suffix', cpuUsage: number) {
    this.pattern = pattern;
    this.patternType = patternType;
    this.cpuUsage = cpuUsage;
    this.isRunning = true;

    // 清理现有workers
    this.workers.forEach((state) => {
      try {
        state.worker.terminate();
      } catch (error) {
        console.error('Error terminating worker:', error);
      }
    });
    this.workers.clear();

    // 创建新workers
    const workerCount = Math.max(1, Math.min(this.MAX_WORKERS, Math.floor(this.cpuUsage / 25)));
    for (let i = 0; i < workerCount; i++) {
      this.createWorker(i);
    }
  }

  stop() {
    this.isRunning = false;
    
    // 停止所有workers
    this.workers.forEach((state) => {
      try {
        state.worker.postMessage({ action: 'stop' });
        state.worker.terminate();
      } catch (error) {
        console.error('Error stopping worker:', error);
      }
    });
    this.workers.clear();
  }

  pause() {
    this.workers.forEach((state) => {
      try {
        state.worker.postMessage({ action: 'stop' });
        state.status = 'paused';
      } catch (error) {
        console.error('Error pausing worker:', error);
      }
    });
  }

  resume() {
    if (!this.isRunning) return;
    
    this.workers.forEach((state, id) => {
      if (state.status === 'paused') {
        this.restartWorker(id);
      }
    });
  }

  cleanup() {
    this.stop();
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.removeAllListeners();
  }
}
