import { APIError } from '@/types/api';
import { 
  TickData, 
  ScoreData, 
  ProposalData, 
  TransfersData,
  BlockValueData,
  ApoolStats,
  IdleStatus
} from '@/types/api';

class QubicAPI {
  private static readonly BASE_URL = 'https://api.qubic.site/api/qubic';

  private static readonly CACHE_DURATION = {
    tick: 5 * 60 * 1000,       // 5 minutes
    score: 5 * 60 * 1000,      // 5 minutes
    price: 5 * 60 * 1000,      // 5 minutes
    apool: 5 * 60 * 1000,      // 5 minutes
    revenue: 5 * 60 * 1000,    // 5 minutes
    proposals: 5 * 60 * 1000,  // 5 minutes
    transfers: 5 * 60 * 1000   // 5 minutes
  };

  private static cache = {
    tick: { data: null as TickData | null, timestamp: 0 },
    score: { data: null as ScoreData | null, timestamp: 0 },
    price: { data: null as number | null, timestamp: 0 },
    proposals: { data: null as ProposalData[] | null, timestamp: 0 },
    transfers: { data: null as TransfersData | null, timestamp: 0 },
    apool: { data: null as ApoolStats | null, timestamp: 0 },
    revenue: { data: null as number | null, timestamp: 0 }
  };

  // ...

  /**
   * 检查缓存是否有效
   * @param timestamp 缓存时间戳
   * @param duration 缓存时长
   * @returns boolean 缓存是否有效
   */
  private static isCacheValid(timestamp: number, duration: number): boolean {
    return Date.now() - timestamp < duration;
  }

  // ...

  /**
   * 基础 API 请求方法
   * @param url API 请求 URL
   * @param options 请求选项
   * @param timeout 超时时间（默认 10 秒）
   * @returns Promise<Response> 返回请求响应
   */
  private static async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        keepalive: true,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 带重试的 API 请求方法
   * @param url API 请求 URL
   * @param options 请求选项
   * @param retries 重试次数（默认 2 次）
   * @returns Promise<T> 返回请求响应数据
   */
  private static async fetchWithRetry<T>(url: string, options: RequestInit = {}, retries = 2): Promise<T> {
    let lastError: Error | null = null;
    let delay = 1000; // 初始延迟1秒

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.fetchWithTimeout(url, options);
        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // 指数退避
        }
      }
    }

    throw lastError;
  }

  /**
   * API 请求方法
   * @param endpoint API 端点
   * @returns Promise<T> 返回请求响应数据
   */
  private static async fetchAPI<T>(endpoint: string): Promise<T> {
    const startTime = performance.now();
    const url = `${this.BASE_URL}${endpoint}`;
    
    try {
      console.log(`Starting API request to ${endpoint}`);
      const response = await this.fetchWithRetry<any>(url, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      // 验证响应数据
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid API response');
      }

      // 特殊处理 /tick 端点
      if (endpoint === '/tick') {
        if (typeof response.currentEpoch !== 'number' || typeof response.price !== 'number') {
          console.error('Invalid tick data:', response);
          throw new Error('Invalid tick data structure');
        }
      }

      const endTime = performance.now();
      console.log(`API request to ${endpoint} took ${(endTime - startTime).toFixed(2)}ms`);
      return response as T;
    } catch (error) {
      const endTime = performance.now();
      console.error(`API request to ${endpoint} failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * 获取 Tick 数据（当前纪元和价格信息）
   * @returns Promise<TickData> 返回 Tick 数据
   */
  static async getTick(): Promise<TickData> {
    if (this.cache.tick.data && this.isCacheValid(this.cache.tick.timestamp, this.CACHE_DURATION.tick)) {
      return this.cache.tick.data;
    }

    const data = await this.fetchAPI<TickData>('/tick');
    this.cache.tick = { data, timestamp: Date.now() };
    return data;
  }

  /**
   * 获取评分数据（包含算力和解决方案信息）
   * @returns Promise<ScoreData> 返回评分数据
   */
  static async getScore(): Promise<ScoreData> {
    if (this.cache.score.data && this.isCacheValid(this.cache.score.timestamp, this.CACHE_DURATION.score)) {
      return this.cache.score.data;
    }

    const data = await this.fetchAPI<ScoreData>('/score');
    this.cache.score = { data, timestamp: Date.now() };
    return data;
  }

  /**
   * 获取提案数据
   * @returns Promise<ProposalData[]> 返回提案数据数组
   */
  static async getProposals(): Promise<ProposalData[]> {
    if (this.cache.proposals.data && this.isCacheValid(this.cache.proposals.timestamp, this.CACHE_DURATION.proposals)) {
      return this.cache.proposals.data;
    }

    const data = await this.fetchAPI<ProposalData[]>('/proposals');
    this.cache.proposals = { data, timestamp: Date.now() };
    return data;
  }

  /**
   * 获取转账数据
   * @returns Promise<TransfersData> 返回转账数据
   */
  static async getTransfers(): Promise<TransfersData> {
    if (this.cache.transfers.data && this.isCacheValid(this.cache.transfers.timestamp, this.CACHE_DURATION.transfers)) {
      return this.cache.transfers.data;
    }

    const data = await this.fetchAPI<TransfersData>('/transfers');
    this.cache.transfers = { data, timestamp: Date.now() };
    return data;
  }

  /**
   * 获取本纪元产出数据
   * @returns Promise<number> 返回本纪元产出
   */
  private static async getCurrentEpochOutput(): Promise<number> {
    if (this.cache.revenue.data && this.isCacheValid(this.cache.revenue.timestamp, this.CACHE_DURATION.revenue)) {
      return this.cache.revenue.data;
    }

    try {
      const response = await this.fetchAPI<{ average: number }>('/revenue');
      const baseOutput = response.average;
      // 计算当前纪元总产出：基础产出 * 676 * 0.85 * 0.92
      const totalOutput = baseOutput * 676 * 0.85 * 0.92;
      this.cache.revenue = { data: totalOutput, timestamp: Date.now() };
      return totalOutput;
    } catch (error) {
      console.error('Error fetching current epoch output:', error);
      return 0;
    }
  }

  /**
   * 获取区块价值数据
   * 整合 Tick 和 Score 数据来计算完整的区块价值信息
   * @returns Promise<BlockValueData> 返回区块价值数据
   */
  static async getBlockValue(): Promise<BlockValueData> {
    try {
      // 并行请求所有需要的数据
      const [tickData, scoreData, totalEpochOutput] = await Promise.all([
        this.getTick(),
        this.getScore(),
        this.getCurrentEpochOutput()
      ]);

      // 验证价格数据
      if (!tickData || typeof tickData.price !== 'number' || tickData.price < 0) {
        console.error('Invalid price data:', tickData);
        throw new Error('Invalid price data');
      }

      // 验证其他数据
      if (typeof tickData.currentEpoch !== 'number') {
        console.error('Invalid epoch data:', tickData);
        throw new Error('Invalid epoch data');
      }

      if (!scoreData || typeof scoreData.solutionsPerHourCalculated !== 'number' || typeof scoreData.estimatedIts !== 'number') {
        console.error('Invalid score data:', scoreData);
        throw new Error('Invalid score data');
      }

      // 计算每小时解决方案数
      const solutionsPerHour = scoreData.solutionsPerHourCalculated;
      
      // 计算一周内的总 solutions 数
      const solutionsPerWeek = solutionsPerHour * 24 * 7;
      
      // 计算每个 solution 可以获得的币数
      const coinsPerSolution = solutionsPerWeek > 0 ? totalEpochOutput / solutionsPerWeek : 0;
      
      // 计算区块价值（美元）
      const blockValueUSD = coinsPerSolution * tickData.price;

      const result = {
        blockValueUSD,                    // 区块价值（美元）
        networkHashRate: scoreData.estimatedIts,  // 网络总算力
        solutionsPerHour,                 // 每小时解决方案数
        currentEpoch: tickData.currentEpoch,      // 当前纪元
        price: tickData.price,            // 当前价格
        coinsPerSolution,                 // 每个解决方案的币数
      };

      // 验证最终结果
      if (Object.values(result).some(value => typeof value !== 'number' || isNaN(value))) {
        console.error('Invalid calculated values:', result);
        throw new Error('Invalid calculated values');
      }

      return result;
    } catch (error) {
      console.error('Error in getBlockValue:', error);
      throw error;
    }
  }

  /**
   * 批量获取首页需要的所有数据
   * @returns Promise<{ blockValue: BlockValueData, idleStatus: IdleStatus, proposals: ProposalData[], transfers: TransfersData }> 
   */
  static async getHomePageData() {
    const requests = [
      this.getBlockValue(),
      this.getIdleStatus(),
      this.getProposals(),
      this.getTransfers()
    ];

    try {
      const [blockValue, idleStatus, proposals, transfers] = await Promise.all(requests);
      return {
        blockValue,
        idleStatus,
        proposals,
        transfers
      };
    } catch (error) {
      console.error('Failed to fetch home page data:', error);
      throw error;
    }
  }

  /**
   * 获取 Apool 数据
   * @returns Promise<ApoolStats> 返回 Apool 数据
   */
  static async getApoolStats(): Promise<ApoolStats> {
    if (this.cache.apool.data && this.isCacheValid(this.cache.apool.timestamp, this.CACHE_DURATION.apool)) {
      return this.cache.apool.data;
    }

    try {
      const response = await fetch("https://api.qubic.site/api/qubic/apool")
      if (!response.ok) {
        throw new APIError("Failed to fetch Apool stats", response.status)
      }
      const data = (await response.json()) as ApoolResponse
      if (data.status !== "success" || !data.data.result) {
        throw new APIError("Invalid Apool response", 500)
      }
      this.cache.apool = { data: data.data.result, timestamp: Date.now() };
      return data.data.result;
    } catch (error) {
      console.error('Error fetching Apool stats:', error);
      return { accepted_solution: 0, total_share: 0 };
    }
  }

  /**
   * 获取主网 idle 状态
   * @returns Promise<IdleStatus> 返回主网是否处于 idle 状态
   */
  static async getIdleStatus(): Promise<IdleStatus> {
    return this.fetchAPI<IdleStatus>('/idle');
  }
}

interface ApoolResponse {
  data: {
    code: number;
    msg: string;
    result: {
      accepted_solution: number;
      total_share: number;
    };
  };
  status: string;
}

export default QubicAPI;
