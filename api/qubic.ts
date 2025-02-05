import { QubicToolResponse } from '../types/api';
import QubicAPI from '../services/api';

export class QubicAPIHelper {
  static clearCache(): void {
    QubicAPI.clearCache();
  }

  static async getToolData(): Promise<QubicToolResponse> {
    return await QubicAPI.getToolData();
  }

  static async getEpochProgress(): Promise<number> {
    // 获取当前 UTC 时间
    const now = new Date();
    const currentUtcDay = now.getUTCDay();
    const currentUtcHour = now.getUTCHours();
    const currentUtcMinute = now.getUTCMinutes();

    // 计算从纪元开始到现在的小时数
    let hoursSinceEpochStart = 0;

    if (currentUtcDay === 3) {
      // 周三
      if (currentUtcHour === 12) {
        // 正好是 12:00，新纪元刚开始
        hoursSinceEpochStart = 0;
      } else if (currentUtcHour > 12) {
        // 周三 12:00 之后，当前纪元时间
        hoursSinceEpochStart = currentUtcHour - 12;
      } else {
        // 周三 12:00 之前，属于上个纪元
        hoursSinceEpochStart = (7 * 24) - (12 - currentUtcHour);
      }
    } else if (currentUtcDay > 3) {
      // 周四到周六，计算从周三 12:00 开始的时间
      hoursSinceEpochStart = ((currentUtcDay - 3) * 24) + (currentUtcHour - 12);
    } else {
      // 周日到周二，需要加上上周的时间
      hoursSinceEpochStart = ((currentUtcDay + 4) * 24) + (currentUtcHour - 12);
    }

    // 加上分钟的小时比例
    hoursSinceEpochStart += currentUtcMinute / 60;

    // 确保时间不会超过一个纪元的总时间（7天）
    hoursSinceEpochStart = Math.min(hoursSinceEpochStart, 7 * 24);

    // 计算进度百分比
    return Number(((hoursSinceEpochStart / (7 * 24)) * 100).toFixed(2));
  }

  static async getNetworkData(): Promise<{
    solutionsPerHourCalculated: number;
    apoolStats: any;
    minerlabStats: any;
    nevermineStats: any;
    solutionsStats: any;
    pool_hashrate: any;
  }> {
    const toolData = await QubicAPI.getToolData();
    return {
      solutionsPerHourCalculated: toolData.data.solutionsPerHourCalculated,
      apoolStats: toolData.data.apool,
      minerlabStats: toolData.data.minerlab,
      nevermineStats: toolData.data.nevermine,
      solutionsStats: toolData.data.solutions,
      pool_hashrate: toolData.data.pool_hashrate
    };
  }

  static async getPrice(): Promise<string> {
    const toolData = await QubicAPI.getToolData();
    return toolData.data.price;
  }

  static async getTotalSolutions(): Promise<number> {
    const toolData = await QubicAPI.getToolData();
    return toolData.data.total_solutions;
  }

  static async getCurrentEpoch(): Promise<number> {
    const toolData = await QubicAPI.getToolData();
    return toolData.data.currentEpoch;
  }
}

// 为了保持兼容性，我们将 QubicAPIHelper 导出为 QubicAPI
export { QubicAPIHelper as QubicAPI };
