// API 响应类型定义
export interface TransfersData {
  data?: {
    transfers: {
      transactions: Array<{
        transactions: Array<{
          transaction: {
            sourceId: string;
            amount: string;
          };
        }>;
      }>;
    };
  };
}

export interface ProposalData {
  title: string;
  published: string;
  url: string;
  sumOption0: number;
  sumOption1: number;
  sumOption2: number;
  sumOption3: number;
  sumOption4: number;
  totalVotes: number;
}

export interface TickData {
  currentEpoch: number;
  price: number;
}

export interface BlockValueData {
  blockValueUSD: number;
  networkHashRate: number;
  solutionsPerHour: number;
  currentEpoch: number;
  price: number;
  coinsPerSolution: number;
}

export interface Score {
  isComputor: boolean;
  publicKey: string;
  score: number;
}

export interface QubicData {
  currentEpoch: number;
  price: number;
}

export interface ScoreData {
  estimatedIts: number;
  solutionsPerHourCalculated: number;
  scores: Score[];
}

export interface ExchangeRates {
  CNY: number;
  [key: string]: number; 
}

export interface EpochTime {
  currentEpoch: number;
  epochStartTime: Date;
  epochEndTime: Date;
  remainingTime: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
}

export interface RevenueStatistic {
  epoch: number;
  daydate: string;
  maxRevenue: number;
  minRevenue: number;
  revenues: {
    identity: string;
    index: string;
    revenue: number;
  }[];
}

export interface RevenueData {
  average: number;
  averagePercentage: number;
  createdAt: string;
  epoch: number;
  epochs: number[];
  max: number;
  min: number;
  revenueStatistics: RevenueStatistic[];
  revenues: {
    identity: string;
    index: string;
    revenue: number;
  }[];
  timeStamp: string;
  votes: number;
}

export interface ApoolStats {
  accepted_solution: number;
  corrected_hashrate: number;
  pool_hash: number;
  shares_per_solution: number;
  total_share: number;
}

export interface IdleStatus {
  idle: boolean;
}

export interface QubicToolResponse {
  data: {
    CNY: number;
    burnedQus: string;
    circulatingSupply: string;
    marketCap: string;
    totalLocked: string;
    totalBlocks: number;
    assets: {
      smart_contract: {
        MLM: {
          issuer: string;
          price: number;
        };
        QEARN: {
          issuer: string;
          price: number;
        };
        QPOOL: {
          issuer: string;
          price: number;
        };
        QTRY: {
          issuer: string;
          price: number;
        };
        QUTIL: {
          issuer: string;
          price: number;
        };
        QVAULT: {
          issuer: string;
          price: number;
        };
        QX: {
          issuer: string;
          price: number;
        };
        RANDOM: {
          issuer: string;
          price: number;
        };
      };
      tokens: {
        CFB: {
          issuer: string;
          price: number;
        };
        QCAP: {
          issuer: string;
          price: number;
        };
        QFT: {
          issuer: string;
          price: number;
        };
        QWALLET: {
          issuer: string;
          price: number;
        };
        VSTB001: {
          issuer: string;
          price: number;
        };
      };
    };
    apool: ApoolStats;
    minerlab: {
      accepted_solution: number;
      corrected_hashrate: number;
      pool_hash: number;
    };
    nevermine: ApoolStats;
    currentEpoch: number;
    estimatedIts: number;
    idle: boolean;
    pool_hashrate: {
      average: {
        average_apool_hashrate: number;
        average_minerlab_hashrate: number;
        average_nevermine_hashrate: number;
        average_qli_hashrate: number;
        record_count: number;
      };
      current: {
        apool_hashrate: number;
        minerlab_hashrate: number;
        nevermine_hashrate: number;
        qli_hashrate: number;
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
    solutionsPerHour: number;
    solutionsPerHourCalculated: number;
    correctedSolutionsPerHour: number;
    total_solutions: number;
  };
  status: string;
  timestamp: number;
}

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}
