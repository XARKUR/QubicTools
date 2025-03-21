import { z } from 'zod';

/**
 * 可用的矿池选项
 * - placeholder: 占位符选项
 * - qli: QLI 矿池
 * - apool: APool 矿池
 * - solutions: Solutions 矿池
 * - minerlab: MinerLab 矿池
 * - nevermine: NeverMine 矿池
 */
export type PoolOption = "placeholder" | "qli" | "apool" | "minerlab";

/**
 * 挖矿模式
 * - solo: 单机模式
 * - pplns: 按份额计算收益模式
 */
export type MiningMode = "solo" | "qlipplns" | "pplns";

/**
 * 挖矿模式配置
 */
export interface MiningModeConfig {
  /** 模式名称 */
  name: string;
  /** 计算方法 */
  calculate: (params: {
    blocks: number;
    solutionsPerHourCalculated: number;
    price: number;
    hashRate: number;
    networkData: NetworkData;
  }) => {
    coinsPerBlock: number;
    totalCoins: number;
    fiatValue: number;
    expectedDailyBlocks: number;
  };
}

/**
 * 矿池配置信息
 */
export interface PoolConfig {
  /** 矿池名称 */
  name: string;
  /** 可用的挖矿模式及其计算方法 */
  modes: Partial<Record<MiningMode, MiningModeConfig>>;
  /** 默认挖矿模式 */
  defaultMode?: MiningMode;
}

/**
 * 各矿池支持的配置
 */
export const POOL_CONFIGS: Record<PoolOption, PoolConfig> = {
  qli: {
    name: "QLI Pool",
    modes: {
      solo: {
        name: "Reward 85%",
        calculate: ({ blocks, solutionsPerHourCalculated, price, hashRate, networkData }) => {
          const dailyBlocks = calculateExpectedDailyBlocks(
            hashRate,
            networkData.averageMinerlabHashrate,
            solutionsPerHourCalculated
          );
          const coinsPerBlock = MiningCalculator.calculateQliSoloBlockCoins(solutionsPerHourCalculated);
          const totalCoins = coinsPerBlock * blocks;
          return {
            coinsPerBlock,
            totalCoins,
            fiatValue: totalCoins * price,
            expectedDailyBlocks: dailyBlocks
          };
        }
      },
      qlipplns: {
        name: "PPLNS",
        calculate: ({ blocks, solutionsPerHourCalculated, price, hashRate, networkData }) => {
          const dailyBlocks = calculateExpectedDailyBlocks(
            hashRate,
            networkData.averageMinerlabHashrate,
            solutionsPerHourCalculated
          );
          const coinsPerBlock = MiningCalculator.calculateQliPplnsBlockCoins(solutionsPerHourCalculated);
          const totalCoins = coinsPerBlock * blocks;
          return {
            coinsPerBlock,
            totalCoins,
            fiatValue: totalCoins * price,
            expectedDailyBlocks: dailyBlocks
          };
        }
      }
    },
    defaultMode: "solo" as MiningMode
  },
  apool: {
    name: "APool",
    modes: {
      pplns: {
        name: "PPLNS",
        calculate: ({ blocks, solutionsPerHourCalculated, price, hashRate, networkData }) => {
          const dailyBlocks = calculateExpectedDailyBlocks(
            hashRate,
            networkData.averageApoolHashrate,
            solutionsPerHourCalculated
          );
          const coinsPerBlock = MiningCalculator.calculateApoolPplnsBlockCoins(solutionsPerHourCalculated) * networkData.apoolStats.accepted_solution / networkData.apoolStats.total_share; ;
          const totalCoins = coinsPerBlock * blocks;
          return {
            coinsPerBlock,
            totalCoins,
            fiatValue: totalCoins * price,
            expectedDailyBlocks: dailyBlocks * networkData.apoolStats.shares_per_solution
          };
        }
      }
    },
    defaultMode: "pplns" as MiningMode
  },
  minerlab: {
    name: "MinerLab",
    modes: {
      solo: {
        name: "Solo",
        calculate: ({ blocks, solutionsPerHourCalculated, price, hashRate, networkData }) => {
          // MinerLab的solo模式计算
          const dailyBlocks = calculateExpectedDailyBlocks(
            hashRate,
            networkData.averageMinerlabHashrate,
            solutionsPerHourCalculated
          );
          const coinsPerBlock = MiningCalculator.calculateMinerlabBlockCoins(solutionsPerHourCalculated);
          const totalCoins = coinsPerBlock * blocks;
          return {
            coinsPerBlock,
            totalCoins,
            fiatValue: totalCoins * price,
            expectedDailyBlocks: dailyBlocks
          };
        }
      }
    },
    defaultMode: "solo" as MiningMode
  },
  placeholder: {
    name: "Select Pool",
    modes: {},
    defaultMode: undefined
  }
};

/**
 * 网络数据接口
 */
export interface NetworkData {
  solutionsPerHourCalculated: number;  // 纪元平均出块数（动态）
  price: number;                       // 实时币价 (USD)
  averageQliHashrate: number;          // QLI Pool 全网平均算力
  averageApoolHashrate: number;        // APool 全网平均算力
  averageMinerlabHashrate: number;
  apoolStats: {
    accepted_solution: number;
    corrected_hashrate: number;
    pool_hash: number;
    shares_per_solution: number;
    total_share: number;
  };
  minerlabStats: {
    accepted_solution: number;
    corrected_hashrate: number;
    pool_hash: number;
  };
}

/**
 * 计算预期每日出块数
 * @param hashRate - 用户输入算力
 * @param networkHashRate - 全网平均总算力
 * @param solutionsPerHourCalculated - 每小时平均出块数
 * @returns {number} 预期每日出块数
 */
function calculateExpectedDailyBlocks(
  hashRate: number,
  networkHashRate: number,
  solutionsPerHourCalculated: number
): number {
  return (hashRate / networkHashRate) * solutionsPerHourCalculated * 24;
}

/**
 * 计算结果接口
 */
export interface ProfitCalculationResult {
  coinsPerBlock: number;    // 每块币数
  totalCoins: number;       // 总币数
  fiatValue: number;        // 法币价值 (USD)，汇率转换由 useExchangeRate.formatCurrency 处理
  expectedDailyBlocks: number; // 预期每日出块数
  expectedDailyCoins: number;
  expectedDailyFiatValue: number;
}

/**
 * 表单数据类型
 */
export interface MiningCalculatorFormData {
  hashRate: string;
  power: string;
  electricityPrice: string;
  blocks: string;
  pool: PoolOption;
  miningMode?: MiningMode;
}

/**
 * 表单Schema
 */
export const miningCalculatorFormSchema = z.object({
  hashRate: z.string(),
  power: z.string(),
  electricityPrice: z.string(),
  blocks: z.string(),
  pool: z.enum(["placeholder", "qli", "apool", "minerlab"]),
  miningMode: z.enum(["solo", "pplns", "qlipplns"]).optional()
});

/**
 * 常量定义
 */
export const MINING_CONSTANTS = {
  EPOCH_TOTAL_OUTPUT: 1000000000000,  // 纪元总产出
  BURN_RATE: 0.9,                     // 燃烧率 (100% - 10%)
  CCF_RATE_1: 0.92,                   // CCF基金分配率1 (100% - 8%)
  CCF_RATE_2: 0.8775,                 // CCF基金分配率2 (100% - 12.25%)
  TOTAL_COMPUTORS: 676,               // 计算机总数
  HOURS_PER_EPOCH: 168,               // 一星期小时数
  QLI_ADJUSTMENT: 1.06,          // qli 矿池调整因子
  QLI_SOLO_POOL_FEE: 0.85,           // QLI Pool Solo模式矿池费率 (100% - 15%)
  QLI_PPLNS_POOL_FEE: 0.9,           // QLI Pool PPLNS模式矿池费率 (100% - 10%)
  APOOL_PPLNS_POOL_FEE: 0.9,           // APool PPLNS模式矿池费率 (100% - 10%)
  MINERLAB_POOL_OUTPUT: 954000000,           // Minerlab 产出
  MINERLAB_ADJUSTMENT: 1.06,          // Minerlab 矿池调整因子
} as const;

/**
 * 计算当前周期内的预期出块数的参数接口
 */
interface CalculateCurrentEpochBlocksParams {
  /** 每日预期出块数 */
  dailyBlocks: number;
  /** 开始时间（可选） */
  startDate?: Date;
}

/**
 * 挖矿计算器类
 * 用于计算不同矿池和模式下的挖矿收益
 */
export class MiningCalculator {
  /**
   * 计算单个computor的基础产出
   * @returns 预计产出的块数
   */
  public static calculateComputorBaseOutput(): number {
    return (
      MINING_CONSTANTS.EPOCH_TOTAL_OUTPUT *
      MINING_CONSTANTS.BURN_RATE *
      MINING_CONSTANTS.CCF_RATE_1 *
      MINING_CONSTANTS.CCF_RATE_2 /
      MINING_CONSTANTS.TOTAL_COMPUTORS
    );
  }

  /**
   * QLI Pool Solo模式计算块币数
   * @param solutionsPerHourCalculated - 纪元平均出块数（动态）
   * @returns 预计产出的币数
   */
  public static calculateQliSoloBlockCoins(solutionsPerHourCalculated: number): number {
    const computorOutput = this.calculateComputorBaseOutput();
    return (
      computorOutput *
      MINING_CONSTANTS.QLI_SOLO_POOL_FEE /
      (solutionsPerHourCalculated *
        MINING_CONSTANTS.HOURS_PER_EPOCH /
        MINING_CONSTANTS.TOTAL_COMPUTORS *
        MINING_CONSTANTS.QLI_ADJUSTMENT)
    );
  }

  /**
   * QLI Pool PPLNS模式计算块币数
   * @param solutionsPerHourCalculated - 纪元平均出块数（动态）
   * @returns 预计产出的币数
   */
  public static calculateQliPplnsBlockCoins(solutionsPerHourCalculated: number): number {
    const computorOutput = this.calculateComputorBaseOutput();
    return (
      computorOutput *
      MINING_CONSTANTS.QLI_PPLNS_POOL_FEE /
      (solutionsPerHourCalculated *
        MINING_CONSTANTS.HOURS_PER_EPOCH /
        MINING_CONSTANTS.TOTAL_COMPUTORS *
        MINING_CONSTANTS.QLI_ADJUSTMENT)
    );
  }

  /**
   * APool PPLNS模式计算块币数
   * @param solutionsPerHourCalculated - 纪元平均出块数（动态）
   * @returns 预计产出的币数
   */
  public static calculateApoolPplnsBlockCoins(solutionsPerHourCalculated: number): number {
    const computorOutput = this.calculateComputorBaseOutput();
    return (
      computorOutput *
      MINING_CONSTANTS.APOOL_PPLNS_POOL_FEE /
      (solutionsPerHourCalculated *
        MINING_CONSTANTS.HOURS_PER_EPOCH /
        MINING_CONSTANTS.TOTAL_COMPUTORS)
    );
  }

  /**
   * 计算单个computor的基础产出
   * @returns 预计产出的块数
   */
  public static calculateMinerlabBaseOutput(): number {
    return (
      MINING_CONSTANTS.MINERLAB_POOL_OUTPUT
    );
  }

  /**
   * Minerlab 计算块币数
   * @param solutionsPerHourCalculated - 纪元平均出块数（动态）
   * @returns 预计产出的币数
   */
  public static calculateMinerlabBlockCoins(solutionsPerHourCalculated: number): number {
    const minerlabOutput = this.calculateMinerlabBaseOutput();
    return (
      minerlabOutput /
      (solutionsPerHourCalculated *
        MINING_CONSTANTS.HOURS_PER_EPOCH /
        MINING_CONSTANTS.TOTAL_COMPUTORS *
        MINING_CONSTANTS.MINERLAB_ADJUSTMENT
      )
    );
  }


  /**
   * 判断当前时间是否在周期内
   * @param date - 要判断的时间
   * @returns {boolean} 是否在周期内
   * @private
   */
  private static isInCurrentEpoch(date: Date): boolean {
    // 获取UTC时间
    const utcDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const day = utcDate.getUTCDay();
    const hour = utcDate.getUTCHours();

    // 如果是周三且在12点之后，或者是周四到周二，就是在当前周期内
    return (day === 3 && hour >= 12) || (day > 3) || (day < 3);
  }

  /**
   * 获取周期开始时间
   * @param date - 参考时间
   * @returns {Date} 周期开始时间
   * @private
   */
  private static getEpochStartTime(date: Date): Date {
    const day = date.getUTCDay();
    const hour = date.getUTCHours();

    // 创建一个新的日期对象，复制输入日期
    const epochStart = new Date(date);
    
    // 设置为当天的12:00 UTC
    epochStart.setUTCHours(12, 0, 0, 0);

    // 如果不是周三，或者是周三但还没到12点，都算作上个周期
    if (day !== 3 || (day === 3 && hour < 12)) {
      // 计算需要回退的天数，回到上周三
      const daysToLastWednesday = (day < 3) ? (day + 4) : (day - 3);
      epochStart.setUTCDate(epochStart.getUTCDate() - daysToLastWednesday);
    }

    console.log('Current UTC time:', date.toUTCString());
    console.log('Epoch start time:', epochStart.toUTCString());
    return epochStart;
  }

  /**
   * 计算当前周期内的预期出块数
   * @param params - 计算参数
   * @param params.dailyBlocks - 每日预期出块数
   * @param params.startDate - 开始时间（可选，默认为周三UTC+0 12:00）
   * @returns {number} 当前周期内的预期出块数
   */
  public static calculateCurrentEpochBlocks(params: CalculateCurrentEpochBlocksParams): number {
    const { dailyBlocks, startDate } = params;
    const now = new Date();

    // 如果没有设置开始时间，使用默认的计算逻辑
    if (!startDate) {
      return this.calculateDefaultEpochBlocks(dailyBlocks);
    }

    // 获取当前周期的开始时间
    const currentEpochStart = this.getEpochStartTime(now);
    
    // 获取当前周期的结束时间
    const currentEpochEnd = new Date(currentEpochStart);
    currentEpochEnd.setUTCDate(currentEpochEnd.getUTCDate() + 7);

    // 将用户选择的时间设置到当前周期
    const userStartDate = new Date(startDate);
    
    // 获取用户选择时间的周和小时
    const userDay = userStartDate.getUTCDay();
    const userHour = userStartDate.getUTCHours();
    const userMinute = userStartDate.getUTCMinutes();

    // 创建新的日期，基于当前周期的开始时间
    const adjustedStartDate = new Date(currentEpochStart);
    
    // 调整到用户选择的周几
    const dayDiff = userDay - adjustedStartDate.getUTCDay();
    adjustedStartDate.setUTCDate(adjustedStartDate.getUTCDate() + dayDiff);
    
    // 设置用户选择的时间
    adjustedStartDate.setUTCHours(userHour, userMinute, 0, 0);

    // 如果调整后的时间早于当前周期开始时间，移到下一周
    if (adjustedStartDate < currentEpochStart) {
      adjustedStartDate.setUTCDate(adjustedStartDate.getUTCDate() + 7);
    }

    console.log('Now:', now.toUTCString());
    console.log('Current epoch start:', currentEpochStart.toUTCString());
    console.log('Current epoch end:', currentEpochEnd.toUTCString());
    console.log('Original user date:', userStartDate.toUTCString());
    console.log('Adjusted user date:', adjustedStartDate.toUTCString());

    // 如果调整后的时间在未来或不在当前周期内，返回0
    if (adjustedStartDate > now || adjustedStartDate < currentEpochStart || adjustedStartDate >= currentEpochEnd) {
      console.log('Selected time is invalid');
      return 0;
    }

    // 计算时间差（小时）
    const hoursDiff = Math.max(0, (now.getTime() - adjustedStartDate.getTime()) / (1000 * 60 * 60));
    console.log('Hours diff:', hoursDiff);

    // 计算预期出块数
    const expectedBlocks = (dailyBlocks * hoursDiff) / 24;
    console.log('Daily blocks:', dailyBlocks);
    console.log('Expected blocks:', expectedBlocks);
    return expectedBlocks;
  }

  /**
   * 使用默认时间（周三UTC+0 12:00）计算当前周期内的预期出块数
   * @param dailyBlocks - 每日预期出块数
   * @returns {number} 当前周期内的预期出块数
   * @private
   */
  private static calculateDefaultEpochBlocks(dailyBlocks: number): number {
    const now = new Date();
    
    // 获取周期开始时间
    const epochStartTime = this.getEpochStartTime(now);

    // 计算从周期开始到现在的小时数
    const hoursSinceEpochStart = Math.max(0, (now.getTime() - epochStartTime.getTime()) / (1000 * 60 * 60));

    // 根据已经过去的小时数和每日出块数计算预期出块数
    return (dailyBlocks * hoursSinceEpochStart) / 24;
  }

  /**
   * 获取周期结束时间
   * @returns {Date} 周期结束时间
   */
  public static getEpochEndTime(): Date {
    const now = new Date();
    const currentEpochStart = this.getEpochStartTime(now);
    const epochEnd = new Date(currentEpochStart);
    epochEnd.setUTCDate(epochEnd.getUTCDate() + 7);
    return epochEnd;
  }

  /**
   * 计算幸运值
   * @param actualBlocks - 实际出块数
   * @param expectedBlocks - 预期出块数
   * @returns {number} 幸运值（百分比）
   */
  public static calculatePerformance(actualBlocks: number, expectedBlocks: number): number {
    if (expectedBlocks === 0) return 0;
    return (actualBlocks / expectedBlocks) * 100;
  }

  /**
   * 计算挖矿成本
   * @param powerConsumption - 功耗（瓦）
   * @param electricityPrice - 电价（每度）
   * @returns {number} 每日成本
   */
  public static calculateCosts(powerConsumption: number, electricityPrice: number): number {
    return (powerConsumption * 24) / 1000 * electricityPrice;
  }

  /**
   * 计算当前收益（考虑币价和汇率）
   * @param params - 计算参数
   * @param params.pool - 选择的矿池
   * @param params.miningMode - 挖矿模式
   * @param params.blocks - 用户输入的块数
   * @param params.networkData - 网络数据
   * @param params.hashRate - 用户输入算力
   * @param params.currency - 币种
   * @returns 收益统计信息
   */
  public static calculateProfit(params: {
    pool: PoolOption;
    miningMode: MiningMode;
    blocks: number;
    networkData: NetworkData;
    hashRate: number;
    currency: 'usd' | 'cny';
  }): ProfitCalculationResult {
    const { pool, miningMode, blocks, networkData, hashRate } = params;
    
    if (pool === 'placeholder' || !POOL_CONFIGS[pool].modes[miningMode]) {
      return {
        coinsPerBlock: 0,
        totalCoins: 0,
        fiatValue: 0,
        expectedDailyBlocks: 0,
        expectedDailyCoins: 0,
        expectedDailyFiatValue: 0
      };
    }

    const mode = POOL_CONFIGS[pool].modes[miningMode];
    const result = mode.calculate({
      blocks,
      solutionsPerHourCalculated: networkData.solutionsPerHourCalculated,
      price: networkData.price,
      hashRate,
      networkData
    });

    const {
      coinsPerBlock,
      totalCoins,
      fiatValue,
      expectedDailyBlocks
    } = result;

    // 计算预期每日收益
    const expectedDailyCoins = expectedDailyBlocks * coinsPerBlock;
    const expectedDailyFiatValue = expectedDailyCoins * networkData.price;

    return {
      coinsPerBlock,
      totalCoins,
      fiatValue,
      expectedDailyBlocks,
      expectedDailyCoins,
      expectedDailyFiatValue
    };
  }
}
