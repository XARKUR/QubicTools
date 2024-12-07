import { APIError } from '@/types/api';

interface NetworkStatsResponse {
  data: {
    average_qli_hashrate: number;
    average_apool_hashrate: number;
    accepted_solution: number;
    corrected_hashrate: number;
    estimated_its: number;
    pool_hash: number;
    total_blocks: number;
    is_idle: boolean;
    period_start: string;
    current_time: string;
    record_count: number;
  };
  status: string;
}

interface NetworkStats {
  averageHashrate: number;
  averageApoolHashrate: number;
  latestStats: {
    acceptedSolution: number;
    correctedHashrate: number;
    estimatedIts: number;
    poolHash: number;
    totalBlocks: number;
    isIdle: boolean;
  };
  periodStart: string;
  currentTime: string;
  recordCount: number;
}

class QubicAPI {
  private static readonly BASE_URL = 'https://api.qubic.site/api/qubic';

  private static readonly CACHE_DURATION = {
    tick: 5 * 60 * 1000,       // 5 minutes
    score: 5 * 60 * 1000,      // 5 minutes
    price: 5 * 60 * 1000,      // 5 minutes
    apool: 5 * 60 * 1000,      // 5 minutes
    revenue: 5 * 60 * 1000,    // 5 minutes
    proposals: 5 * 60 * 1000,  // 5 minutes
    transfers: 5 * 60 * 1000,  // 5 minutes
    networkStats: 5 * 60 * 1000, // 5 minutes
  };

  private static cache = {
    tick: { data: null as any | null, timestamp: 0 },
    score: { data: null as any | null, timestamp: 0 },
    price: { data: null as number | null, timestamp: 0 },
    proposals: { data: null as any[] | null, timestamp: 0 },
    transfers: { data: null as any | null, timestamp: 0 },
    apool: { data: null as any | null, timestamp: 0 },
    revenue: { data: null as number | null, timestamp: 0 },
    networkStats: { data: null as NetworkStats | null, timestamp: 0 },
  };

  // ...

  /**
   * 
   * @param timestamp 
   * @param duration 
   * @returns 
   */
  private static isCacheValid(timestamp: number, duration: number): boolean {
    return Date.now() - timestamp < duration;
  }

  // ...

  /**
   * 
   * @param url 
   * @param options 
   * @param timeout 
   * @returns Promise<Response> 
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
   * 
   * @param url 
   * @param options 
   * @param retries 
   * @returns Promise<T> 
   */
  private static async fetchWithRetry<T>(url: string, options: RequestInit = {}, retries = 2): Promise<T> {
    let lastError: Error | null = null;
    let delay = 1000; 

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.fetchWithTimeout(url, options);
        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; 
        }
      }
    }

    throw lastError;
  }

  /**
   * 
   * @param endpoint 
   * @returns Promise<T> 
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
      
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid API response');
      }

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
   * 
   * @returns Promise<any> 
   */
  static async getTick(): Promise<any> {
    if (this.cache.tick.data && this.isCacheValid(this.cache.tick.timestamp, this.CACHE_DURATION.tick)) {
      return this.cache.tick.data;
    }

    const data = await this.fetchAPI<any>('/tick');
    this.cache.tick = { data, timestamp: Date.now() };
    return data;
  }

  /**
   * 
   * @returns Promise<any> 
   */
  static async getScore(): Promise<any> {
    if (this.cache.score.data && this.isCacheValid(this.cache.score.timestamp, this.CACHE_DURATION.score)) {
      return this.cache.score.data;
    }

    const data = await this.fetchAPI<any>('/score');
    this.cache.score = { data, timestamp: Date.now() };
    return data;
  }

  /**
   * 
   * @returns Promise<any[]> 
   */
  static async getProposals(): Promise<any[]> {
    if (this.cache.proposals.data && this.isCacheValid(this.cache.proposals.timestamp, this.CACHE_DURATION.proposals)) {
      return this.cache.proposals.data;
    }

    const data = await this.fetchAPI<any[]>('/proposals');
    this.cache.proposals = { data, timestamp: Date.now() };
    return data;
  }

  /**
   * 
   * @returns Promise<any> 
   */
  static async getTransfers(): Promise<any> {
    if (this.cache.transfers.data && this.isCacheValid(this.cache.transfers.timestamp, this.CACHE_DURATION.transfers)) {
      return this.cache.transfers.data;
    }

    const data = await this.fetchAPI<any>('/transfers');
    this.cache.transfers = { data, timestamp: Date.now() };
    return data;
  }

  /**
   * 
   * @returns Promise<number> 
   */
  private static async getCurrentEpochOutput(): Promise<number> {
    if (this.cache.revenue.data && this.isCacheValid(this.cache.revenue.timestamp, this.CACHE_DURATION.revenue)) {
      return this.cache.revenue.data;
    }

    try {
      const response = await this.fetchAPI<{ average: number }>('/revenue');
      const baseOutput = response.average;
      const totalOutput = baseOutput * 676 * 0.9 * 0.92 * 0.8775;
      this.cache.revenue = { data: totalOutput, timestamp: Date.now() };
      return totalOutput;
    } catch (error) {
      console.error('Error fetching current epoch output:', error);
      return 0;
    }
  }

  /**
   * 
   * @returns Promise<NetworkStats> 
   */
  static async getNetworkStats(): Promise<NetworkStats> {
    if (this.cache.networkStats.data && this.isCacheValid(this.cache.networkStats.timestamp, this.CACHE_DURATION.networkStats)) {
      return this.cache.networkStats.data;
    }

    try {
      const response = await this.fetchAPI<NetworkStatsResponse>('/network-stats');
      
      const networkStats = {
        averageHashrate: response.data.average_qli_hashrate,        
        averageApoolHashrate: response.data.average_apool_hashrate, 
        latestStats: {
          acceptedSolution: response.data.accepted_solution,
          correctedHashrate: response.data.corrected_hashrate,
          estimatedIts: response.data.estimated_its,
          poolHash: response.data.pool_hash,
          totalBlocks: response.data.total_blocks,
          isIdle: response.data.is_idle                            
        },
        periodStart: response.data.period_start,
        currentTime: response.data.current_time,                    
        recordCount: response.data.record_count,
      };

      this.cache.networkStats = { data: networkStats, timestamp: Date.now() };
      return networkStats;
    } catch (error) {
      console.error('Error in getNetworkStats:', error);
      throw error;
    }
  }

  /**
   * 
   * 
   * @returns Promise<any> 
   */
  static async getBlockValue(): Promise<any> {
    try {
      const [tickData, scoreData, totalEpochOutput, networkStats] = await Promise.all([
        this.getTick(),
        this.getScore(),
        this.getCurrentEpochOutput(),
        this.getNetworkStats()
      ]);

      if (!tickData || typeof tickData.price !== 'number' || tickData.price < 0) {
        console.error('Invalid price data:', tickData);
        throw new Error('Invalid price data');
      }

      if (typeof tickData.currentEpoch !== 'number') {
        console.error('Invalid epoch data:', tickData);
        throw new Error('Invalid epoch data');
      }

      if (!scoreData || typeof scoreData.solutionsPerHourCalculated !== 'number' || typeof scoreData.solutionsPerHour !== 'number') {
        console.error('Invalid score data:', scoreData);
        throw new Error('Invalid score data');
      }

      if (!networkStats || typeof networkStats.averageHashrate !== 'number') {
        console.error('Invalid network stats:', networkStats);
        throw new Error('Invalid network stats');
      }
      
      const solutionsPerWeek = scoreData.solutionsPerHourCalculated * 24 * 7;
      
      const coinsPerSolution = solutionsPerWeek > 0 ? totalEpochOutput / solutionsPerWeek : 0;
      
      const blockValueUSD = coinsPerSolution * tickData.price;

      const result = {
        blockValueUSD,                           
        networkHashRate: networkStats.averageHashrate,  
        averageHashrate: networkStats.averageHashrate,  
        averageApoolHashrate: networkStats.averageApoolHashrate, 
        solutionsPerHour: scoreData.solutionsPerHour,  
        solutionsPerHourCalculated: scoreData.solutionsPerHourCalculated, 
        currentEpoch: tickData.currentEpoch,     
        price: tickData.price,                   
        coinsPerSolution,                        
        totalBlocks: networkStats.latestStats.totalBlocks, 
      };

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
   * 
   * @returns Promise<{ blockValue: any, idleStatus: any, proposals: any[], transfers: any }> 
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
   * 
   * @returns Promise<any> 
   */
  static async getApoolStats(): Promise<any> {
    if (this.cache.apool.data && this.isCacheValid(this.cache.apool.timestamp, this.CACHE_DURATION.apool)) {
      return this.cache.apool.data;
    }

    try {
      const response = await fetch("https://api.qubic.site/api/qubic/apool")
      if (!response.ok) {
        throw new APIError("Failed to fetch Apool stats", response.status)
      }
      const data = (await response.json()) as any
      if (data.status !== "success" || !data.data.result) {
        throw new APIError("Invalid Apool response", 500)
      }
      this.cache.apool = { data, timestamp: Date.now() };
      return data;
    } catch (error) {
      console.error('Error fetching Apool stats:', error);
      return { status: "error", data: { result: { accepted_solution: 0, total_share: 0 } } };
    }
  }

  /**
   * 
   * @returns Promise<any> 
   */
  static async getIdleStatus(): Promise<any> {
    return this.fetchAPI<any>('/idle');
  }
}

export default QubicAPI;
