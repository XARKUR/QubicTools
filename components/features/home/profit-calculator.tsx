"use client"

import { memo, useMemo, useEffect, useState, useCallback } from "react"
import { useTranslation } from 'react-i18next'
import {
  Calculator,
  Timer,
  Zap,
  Cpu,
  Box,
  Settings,
  Heart,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import QubicAPI from "@/services/api"
import { useExchangeRate } from '@/hooks/useExchangeRate'

// 定义矿池选项类型
export type PoolOption = "placeholder" | "qli" | "apool";

// 表单数据模式定义
export const profitCalculatorFormSchema = z.object({
  hashRate: z.string(),
  power: z.string(),
  electricityPrice: z.string(),
  blocks: z.string(),
  pool: z.enum(["placeholder", "qli", "apool"]),
});

// 导出表单数据类型
export type ProfitCalculatorFormData = z.infer<typeof profitCalculatorFormSchema>;

/**
 * 统计项属性接口
 * @interface StatItemProps
 * @property {string} label - 统计项标签
 * @property {string} value - 统计项值
 * @property {React.ReactNode} [icon] - 可选的图标
 * @property {string} [className] - 可选的样式类名
 * @property {string} [valueColor] - 可选的值颜色
 */
interface StatItemProps {
  label: string
  value: string
  icon?: React.ReactNode
  className?: string
  valueColor?: string
}

/**
 * 统计项组件
 * 用于展示单个统计指标，包括标签、值和可选的图标
 * 
 * @component
 * @param {StatItemProps} props - 组件属性
 */
const StatItem = memo<StatItemProps>(({ label, value, icon, className, valueColor }) => {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={cn("font-medium", valueColor)}>{value}</span>
    </div>
  )
})

StatItem.displayName = "StatItem"

interface NetworkStats {
  solutionsPerHourCalculated: number;
  networkHashRate: number;
  blockValueUSD: number;
}

/**
 * 计算每日预计出块数
 * @param {number} hashRate - 用户算力
 * @param {number} networkHashRate - 网络总算力
 * @param {number} solutionsPerHourCalculated - 每小时出块数
 * @returns {number} 每日预计出块数
 */
const calculateDailyBlocks = (
  hashRate: number,
  networkHashRate: number,
  solutionsPerHourCalculated: number
): number => {
  const blocksPerDay = solutionsPerHourCalculated * 24;
  return (hashRate / networkHashRate) * blocksPerDay;
}

/**
 * 计算幸运度
 * @param {number} actualBlocks - 实际出块数
 * @param {number} expectedBlocks - 预期出块数
 * @returns {number} 幸运度百分比
 */
const calculateLuck = (actualBlocks: number, expectedBlocks: number): number => {
  if (expectedBlocks === 0) return 0;
  return (actualBlocks / expectedBlocks) * 100;
}

/**
 * 计算电力成本
 * @param {number} powerConsumption - 功耗 (W)
 * @param {number} electricityRate - 电价 ($/kWh)
 * @returns {number} 电力成本 ($)
 */
const calculateCosts = (powerConsumption: number, electricityRate: number): number => {
  return (powerConsumption * 24) / 1000 * electricityRate
}

/**
 * 计算当前纪元的预计出块数
 * @param {number} dailyBlocks - 每日预计出块数
 * @returns {number} 当前预计出块数
 */
const calculateCurrentEpochBlocks = (dailyBlocks: number) => {
  const now = new Date();
  const currentDay = now.getUTCDay(); // 0 是周日，3 是周三
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  // 计算从周三 12:00 UTC 到现在的天数
  let daysSinceEpochStart;
  if (currentDay < 3 || (currentDay === 3 && currentHour < 12)) {
    // 如果当前时间在周三12:00之前，需要往回算到上周三
    daysSinceEpochStart = currentDay + 7 - 3;
  } else {
    daysSinceEpochStart = currentDay - 3;
  }

  // 添加小时部分
  let hoursSinceEpochStart = daysSinceEpochStart * 24;
  if (currentDay === 3) {
    // 周三特殊处理
    if (currentHour >= 12) {
      hoursSinceEpochStart += (currentHour - 12);
    } else {
      hoursSinceEpochStart += (currentHour + 12);
    }
  } else {
    hoursSinceEpochStart += currentHour;
  }

  // 添加分钟部分
  const totalHours = hoursSinceEpochStart + (currentMinute / 60);
  
  // 计算当前预计出块数
  return (dailyBlocks * totalHours) / 24;
};

/**
 * 利润计算器 Hook
 * 根据输入的参数计算挖矿收益和成本
 * 
 * @param {z.infer<typeof profitCalculatorFormSchema>} formData - 表单数据
 * @returns {Object} 计算结果，包括日收益、月收益、年收益和投资回报率
 */
const useProfitCalculator = (formData: z.infer<typeof profitCalculatorFormSchema>) => {
  const powerConsumption = parseFloat(formData.power) || 0
  const electricityRate = parseFloat(formData.electricityPrice) || 0
  const blocks = parseFloat(formData.blocks) || 0

  const dailyReward = blocks * 1000 // 临时固定值
  const dailyCost = calculateCosts(powerConsumption, electricityRate)

  return {
    dailyProfit: dailyReward - dailyCost,
    monthlyProfit: (dailyReward - dailyCost) * 30,
    yearlyProfit: (dailyReward - dailyCost) * 365,
    roi: dailyCost > 0 ? (dailyReward / dailyCost) * 100 : 0,
    dailyReward: dailyReward,
    dailyCost: dailyCost
  }
}

/**
 * 挖矿利润计算器组件
 * 
 * 这是一个完整的挖矿利润计算工具，它可以：
 * - 计算预期的挖矿收益
 * - 估算电力成本
 * - 分析投资回报率
 * - 提供日/月/年收益预测
 * 
 * 用户可以输入：
 * - 哈希率
 * - 预期区块数
 * - 功耗
 * - 电价
 * 
 * @component
 * @example
 * ```tsx
 * <ProfitCalculator />
 * ```
 */
export const ProfitCalculator = memo(function ProfitCalculatorComponent() {
  const { t } = useTranslation()
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    solutionsPerHourCalculated: 0,
    networkHashRate: 0,
    blockValueUSD: 0
  });

  const [blockValue, setBlockValue] = useState(0)
  const [apoolRatio, setApoolRatio] = useState<number>(0);

  // 获取网络状态数据
  useEffect(() => {
    let isMounted = true;

    const fetchNetworkStats = async () => {
      try {
        const [blockValueData, apoolStatsData] = await Promise.all([
          QubicAPI.getBlockValue(),
          QubicAPI.getApoolStats(),
        ]);

        if (!isMounted) return;

        setNetworkStats({
          networkHashRate: blockValueData.networkHashRate,
          solutionsPerHourCalculated: blockValueData.solutionsPerHourCalculated,
          blockValueUSD: blockValueData.blockValueUSD
        });

        // 计算 Apool 的 solutions/shares 比例
        const ratio = apoolStatsData.accepted_solution / apoolStatsData.total_share;
        setApoolRatio(ratio || 0);
        setBlockValue(blockValueData.blockValueUSD);
      } catch {
        if (!isMounted) return;
        setNetworkStats({ networkHashRate: 0, solutionsPerHourCalculated: 0, blockValueUSD: 0 });
        setApoolRatio(0);
        setBlockValue(0);
      }
    };

    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 5 * 60 * 1000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const form = useForm<ProfitCalculatorFormData>({
    resolver: zodResolver(profitCalculatorFormSchema),
    defaultValues: {
      hashRate: '',
      power: '',
      electricityPrice: '',
      blocks: '',
      pool: 'placeholder'
    }
  })

  const formData = form.watch();
  const [hashRate, setHashRate] = useState(formData.hashRate || 0);
  const [blocks, setBlocks] = useState(formData.blocks || 0);
  const [power, setPower] = useState(formData.power || 0);
  const [electricityPrice, setElectricityPrice] = useState(formData.electricityPrice || 0);

  // 获取 Apool 数据
  useEffect(() => {
    if (formData.pool === "apool") {
      QubicAPI.getApoolStats().then((data) => {
        if (data.status === "success" && data.data.result) {
          const ratio = data.data.result.total_share / data.data.result.accepted_solution;
          setApoolRatio(ratio || 0);
        }
      });
    }
  }, [formData.pool]);

  // 计算每日预计出块数
  const expectedDailyBlocks = useMemo(() => {
    if (!hashRate || !networkStats.networkHashRate || !networkStats.solutionsPerHourCalculated) return 0;
    
    const blocks = calculateDailyBlocks(
      Number(hashRate),
      networkStats.networkHashRate,
      networkStats.solutionsPerHourCalculated
    );

    return formData.pool === "apool" && apoolRatio > 0 ? blocks * apoolRatio : blocks;
  }, [hashRate, networkStats, formData.pool, apoolRatio]);

  // 计算幸运度
  const luck = calculateLuck(Number(blocks), expectedDailyBlocks);

  // 直接使用 formData，因为属性名已经匹配
  const baseStats = useProfitCalculator(formData);

  // 格式化金额显示
  const { formatCurrency } = useExchangeRate()
  const formatUSD = useCallback((value: number) => {
    return formatCurrency(value)
  }, [formatCurrency]);

  // 收益分析计算
  const profitStats = useMemo(() => {
    // 计算基础收益
    const calculateBaseProfit = (blocks: number) => {
      let profit = 0;
      if (formData.pool === "qli") {
        // QLi pool: 80% of block value
        profit = blocks * blockValue * 0.8;
      } else if (formData.pool === "apool" && apoolRatio > 0) {
        // Apool: 一个 Share 的价值 = 块价值 / apoolRatio * 0.9 (90% 收益)
        const shareValue = blockValue / apoolRatio * 0.9;
        profit = blocks * shareValue;
      }
      return profit;
    };

    // 1. 当前总收益 = 用户输入块数 * 每块收益
    const currentProfit = calculateBaseProfit(Number(blocks));

    // 2. 每日预期收益 = 每日预计出块数 * 每块收益
    const dailyExpectedProfit = calculateBaseProfit(expectedDailyBlocks);

    // 3. 每周和每月预期收益
    const weeklyExpectedProfit = dailyExpectedProfit * 7;
    const monthlyExpectedProfit = dailyExpectedProfit * 30;

    return {
      ...baseStats,
      currentProfit: formatUSD(currentProfit),
      dailyProfit: formatUSD(dailyExpectedProfit),
      weeklyProfit: formatUSD(weeklyExpectedProfit),
      monthlyProfit: formatUSD(monthlyExpectedProfit),
      dailyBlocks: expectedDailyBlocks,
      luck,
      rawDailyProfit: dailyExpectedProfit,
      rawMonthlyProfit: monthlyExpectedProfit
    };
  }, [baseStats, blocks, blockValue, expectedDailyBlocks, luck, formData.pool, apoolRatio, formatUSD]);

  // 成本分析计算
  const costStats = useMemo(() => {
    // 1. 更新功耗和电费单价显示
    const powerDisplay = `${power}W`;
    const rateDisplay = formatUSD(Number(electricityPrice));

    // 2. 计算每日和每月电费支出（使用USD进行计算）
    const dailyPowerCost = (Number(power) * 24) / 1000 * Number(electricityPrice);
    const monthlyPowerCost = dailyPowerCost * 30;

    // 3. 计算预计每日和每月净收入（使用USD进行计算）
    const dailyNetIncome = profitStats.rawDailyProfit - dailyPowerCost;
    const monthlyNetIncome = profitStats.rawMonthlyProfit - monthlyPowerCost;

    return {
      powerConsumptionDisplay: powerDisplay,
      electricityRateDisplay: rateDisplay,
      dailyPowerCost: formatUSD(dailyPowerCost),
      monthlyPowerCost: formatUSD(monthlyPowerCost),
      dailyNetIncome: formatUSD(dailyNetIncome),
      monthlyNetIncome: formatUSD(monthlyNetIncome)
    };
  }, [power, electricityPrice, profitStats.rawDailyProfit, profitStats.rawMonthlyProfit, formatUSD]);

  // 计算当前预计出块数
  const currentEpochBlocks = useMemo(() => {
    const blocks = calculateCurrentEpochBlocks(expectedDailyBlocks);
    return blocks;
  }, [expectedDailyBlocks]);

  // 渲染组件
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {t('home.calculator.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={formData.pool}
              onValueChange={(value: PoolOption) => form.setValue('pool', value)}
            >
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder={t('home.calculator.pool_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>
                  {t('home.calculator.pool_placeholder')}
                </SelectItem>
                <SelectItem value="qli">
                  {t('home.calculator.pool_qli')}
                </SelectItem>
                <SelectItem value="apool">
                  {t('home.calculator.pool_apool')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-17rem)]">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('home.calculator.baseData')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    <Label>{t('home.calculator.hashRate')}</Label>
                  </div>
                  <div className="relative w-32">
                    <Input
                      type="number"
                      value={hashRate}
                      onChange={(e) => setHashRate(Number(e.target.value))}
                      className="pr-12 h-8"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <span className="text-sm text-muted-foreground">it/s</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    <Label htmlFor="blocks">
                      {t('home.calculator.blocks')}
                      {formData.pool === "qli" ? " (Solutions)" : " (Shares)"}
                    </Label>
                  </div>
                  <Input
                    id="blocks"
                    type="number"
                    value={blocks}
                    onChange={(e) => setBlocks(Number(e.target.value))}
                    className="w-32 h-8"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <Label>{t('home.calculator.power')}</Label>
                  </div>
                  <div className="relative w-32">
                    <Input
                      type="number"
                      value={power}
                      onChange={(e) => setPower(Number(e.target.value))}
                      className="pr-8 h-8"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <span className="text-sm text-muted-foreground">{t('home.calculator.powerUnit')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('home.calculator.electricityPrice')}</Label>
                  </div>
                  <div className="relative w-32">
                    <Input
                      type="number"
                      value={electricityPrice}
                      onChange={(e) => setElectricityPrice(Number(e.target.value))}
                      className="pr-14 h-8"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <span className="text-sm text-muted-foreground">{t('home.calculator.electricityPriceUnit')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4" />
                {t('home.calculator.miningInfo')}
              </h4>
              <div className="space-y-2">
                <StatItem
                  icon={<Heart className="h-4 w-4" />}
                  label={t('home.calculator.luck')}
                  value={`${luck.toFixed(2)}%`}
                  valueColor={luck < 100 ? "text-red-500" : "text-green-500"}
                />
                <StatItem
                  icon={<Box className="h-4 w-4" />}
                  label={t('home.calculator.expectedCurrentBlocks')}
                  value={currentEpochBlocks.toFixed(2)}
                />
                <StatItem
                  icon={<Box className="h-4 w-4" />}
                  label={t('home.calculator.expectedDailyBlocks')}
                  value={expectedDailyBlocks.toFixed(2)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('home.calculator.profitAnalysis')}
              </h4>
              <div className="space-y-2">
                <StatItem
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t('home.calculator.currentProfit')}
                  value={profitStats.currentProfit}
                />
                <StatItem
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t('home.calculator.dailyProfit')}
                  value={profitStats.dailyProfit}
                />
                <StatItem
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t('home.calculator.weeklyProfit')}
                  value={profitStats.weeklyProfit}
                />
                <StatItem
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t('home.calculator.monthlyProfit')}
                  value={profitStats.monthlyProfit}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('home.calculator.costAnalysis')}
              </h4>
              <div className="space-y-2">
                <StatItem
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t('home.calculator.dailyPowerCost')}
                  value={costStats.dailyPowerCost}
                />
                <StatItem
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t('home.calculator.monthlyPowerCost')}
                  value={costStats.monthlyPowerCost}
                />
                <StatItem
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t('home.calculator.dailyNetIncome')}
                  value={costStats.dailyNetIncome}
                  valueColor={profitStats.rawDailyProfit - (Number(power) * 24) / 1000 * Number(electricityPrice) < 0 ? "text-red-500" : "text-green-500"}
                />
                <StatItem
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t('home.calculator.monthlyNetIncome')}
                  value={costStats.monthlyNetIncome}
                  valueColor={profitStats.rawMonthlyProfit - (Number(power) * 24 * 30) / 1000 * Number(electricityPrice) < 0 ? "text-red-500" : "text-green-500"}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
})

ProfitCalculator.displayName = "ProfitCalculator"
