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
  accepted_solution: number
  total_share: number
}

export interface IdleStatus {
  idle: boolean
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
