import { APIError } from '@/types/api';

interface QubicToolResponse {
  data: {
    CNY: number;
    apool: {
      accepted_solution: number;
      corrected_hashrate: number;
      pool_hash: number;
      shares_per_solution: number;
      total_share: number;
    };
    minerlab: {
      accepted_solution: number;
      corrected_hashrate: number;
      pool_hash: number;
    };
    currentEpoch: number;
    estimatedIts: number;
    idle: boolean;
    pool_hashrate: {
      average: {
        average_apool_hashrate: number;
        average_minerlab_hashrate: number;
        average_qli_hashrate: number;
        average_solutions_hashrate: number;
        record_count: number;
      };
      current: {
        apool_hashrate: number;
        minerlab_hashrate: number;
        qli_hashrate: number;
        solutions_hashrate: number;
      };
    };
    price: string;
    proposal?: {
      epoch: number;
      hasVotes: boolean;
      options: {
        index: number;
        label: string;
        value?: string;
        votes: number;
      }[];
      proposalType: string;
      published: string;
      status: number;
      title: string;
      totalVotes: number;
      url: string;
    };
    solutions: {
      accepted_solution: number;
      corrected_hashrate: number;
      pool_hash: number;
      pplns_solutions: number;
      shares_per_solution: number;
      solo_solutions: number;
      total_share: number;
    };
    solutionsPerHour: number;
    solutionsPerHourCalculated: number;
    total_solutions: number;
  };
  status: string;
  timestamp: number;
}

class QubicAPI {
  private static readonly BASE_URL = 'https://api-qubic.vercel.app/api/qubic';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cache: {
    toolData: { data: QubicToolResponse | null; timestamp: number };
  } = {
    toolData: { data: null, timestamp: 0 },
  };

  private static isCacheValid(timestamp: number, duration: number): boolean {
    return Date.now() - timestamp < duration;
  }

  private static async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  private static async fetchWithRetry<T>(url: string, options: RequestInit = {}, retries = 2): Promise<T> {
    let lastError: Error | null = null;
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.fetchWithTimeout(url, options);
        if (!response.ok) {
          throw new APIError(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i === retries) break;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    throw lastError;
  }

  private static async fetchAPI<T>(endpoint: string): Promise<T> {
    return this.fetchWithRetry<T>(`${this.BASE_URL}${endpoint}`);
  }

  static async getToolData(): Promise<QubicToolResponse> {
    if (this.cache.toolData.data && this.isCacheValid(this.cache.toolData.timestamp, this.CACHE_DURATION)) {
      return this.cache.toolData.data;
    }

    const data = await this.fetchAPI<QubicToolResponse>('/tool');
    this.cache.toolData = { data, timestamp: Date.now() };
    return data;
  }

  static async getBlockValue(): Promise<any> {
    const toolData = await this.getToolData();
    
    return {
      networkHashRate: toolData.data.pool_hashrate.average.average_qli_hashrate,
      averageHashrate: toolData.data.pool_hashrate.average.average_qli_hashrate,
      averageApoolHashrate: toolData.data.pool_hashrate.average.average_apool_hashrate,
      averageMinerlabHashrate: toolData.data.pool_hashrate.average.average_minerlab_hashrate,
      solutionsPerHour: toolData.data.solutionsPerHour,
      solutionsPerHourCalculated: toolData.data.solutionsPerHourCalculated,
      price: parseFloat(toolData.data.price),
      currentEpoch: toolData.data.currentEpoch,
      totalBlocks: toolData.data.total_solutions,
      idle: toolData.data.idle
    };
  }

  static async getApoolStats(): Promise<any> {
    const toolData = await this.getToolData();
    
    return toolData.data.apool;
  }

  static async getMinerlabStats(): Promise<any> {
    const toolData = await this.getToolData();
    
    return toolData.data.minerlab;
  }

  static async getProposals(): Promise<any[]> {
    return [];
  }
}

export default QubicAPI;
