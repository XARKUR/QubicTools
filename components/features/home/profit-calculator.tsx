"use client"

import { memo, useMemo, useEffect, useState, useCallback } from "react"
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Calculator,
  Zap,
  Timer,
  DollarSign,
  TrendingUp,
  Calendar,
  Settings,
} from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import QubicAPI from "@/services/api"
import { useExchangeRate } from '@/hooks/useExchangeRate'

/**
 * 默认表单值
 * @constant
 */
const DEFAULT_VALUES = {
  hashRate: "",
  blocks: "",
  powerConsumption: "",
  electricityRate: "",
  pool: "qli" as const,
}

/**
 * 表单验证模式
 * @constant
 */
const formSchema = z.object({
  hashRate: z.string(),
  blocks: z.string(),
  powerConsumption: z.string(),
  electricityRate: z.string(),
  pool: z.enum(["qli", "apool"]).default("qli"),
})

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
  solutionsPerHour: number;
  networkHashRate: number;
  blockValueUSD: number;
}

/**
 * 计算每日预计出块数
 * @param {number} hashRate - 用户算力
 * @param {number} networkHashRate - 网络总算力
 * @param {number} solutionsPerHour - 每小时出块数
 * @returns {number} 每日预计出块数
 */
const calculateDailyBlocks = (
  hashRate: number,
  networkHashRate: number,
  solutionsPerHour: number
): number => {
  const blocksPerDay = solutionsPerHour * 24;
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
 * 利润计算器 Hook
 * 根据输入的参数计算挖矿收益和成本
 * 
 * @param {z.infer<typeof formSchema>} formData - 表单数据
 * @returns {Object} 计算结果，包括日收益、月收益、年收益和投资回报率
 */
const useProfitCalculator = (formData: z.infer<typeof formSchema>) => {
  const powerConsumption = parseFloat(formData.powerConsumption) || 0
  const electricityRate = parseFloat(formData.electricityRate) || 0
  const blocks = parseFloat(formData.blocks) || 0

  const dailyReward = blocks * 1000 // 临时固定值
  const dailyCost = calculateCosts(powerConsumption, electricityRate)

  return {
    dailyProfit: dailyReward - dailyCost,
    monthlyProfit: (dailyReward - dailyCost) * 30,
    yearlyProfit: (dailyReward - dailyCost) * 365,
    roi: dailyCost > 0 ? (dailyReward / dailyCost) * 100 : 0,
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
export const ProfitCalculator = memo(function ProfitCalculator() {
  const { t } = useTranslation()
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    solutionsPerHour: 0,
    networkHashRate: 0,
    blockValueUSD: 0
  });

  const [blockValue, setBlockValue] = useState(0)
  const [apoolRatio, setApoolRatio] = useState(0)

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
          solutionsPerHour: blockValueData.solutionsPerHour,
          blockValueUSD: blockValueData.blockValueUSD
        });

        // 计算 Apool 的 solutions/shares 比例
        const ratio = apoolStatsData.accepted_solution / apoolStatsData.total_share;
        setApoolRatio(ratio || 0);
        setBlockValue(blockValueData.blockValueUSD);
      } catch {
        if (!isMounted) return;
        setNetworkStats({ networkHashRate: 0, solutionsPerHour: 0, blockValueUSD: 0 });
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const formData = form.watch();
  const hashRate = parseFloat(formData.hashRate) || 0;
  const blocks = parseFloat(formData.blocks) || 0;
  const powerConsumption = parseFloat(formData.powerConsumption) || 0;
  const electricityRate = parseFloat(formData.electricityRate) || 0;

  // 计算每日预计出块数
  const expectedDailyBlocks = useMemo(() => {
    if (!hashRate || !networkStats.networkHashRate || !networkStats.solutionsPerHour) return 0;

    const rawExpectedBlocks = calculateDailyBlocks(
      hashRate,
      networkStats.networkHashRate,
      networkStats.solutionsPerHour
    );

    // 如果是 Apool，预计出块数需要除以 solutions/shares 比例
    if (formData.pool === "apool" && apoolRatio > 0) {
      return rawExpectedBlocks / apoolRatio;
    }
    return rawExpectedBlocks;
  }, [hashRate, networkStats.networkHashRate, networkStats.solutionsPerHour, formData.pool, apoolRatio]);

  // 计算幸运度
  const luck = calculateLuck(blocks, expectedDailyBlocks);

  const baseStats = useProfitCalculator(formData)

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
        // QLi pool: 85% of block value
        profit = blocks * blockValue * 0.85;
      } else {
        // Apool: Convert shares to solutions using the ratio, then multiply by block value
        const estimatedSolutions = blocks * apoolRatio;
        profit = estimatedSolutions * blockValue * 0.9; // Apool takes 10% fee
      }
      return profit;
    };

    // 1. 当前总收益 = 用户输入块数转换后 * 单个块价值
    const currentProfit = calculateBaseProfit(blocks);

    // 2. 每日预期收益 = 每日预计出块数转换后 * 单个块价值
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
    const powerDisplay = `${powerConsumption}W`;
    const rateDisplay = formatUSD(electricityRate);

    // 2. 计算每日和每月电费支出（使用USD进行计算）
    const dailyPowerCost = (powerConsumption * 24) / 1000 * electricityRate;
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
  }, [powerConsumption, electricityRate, profitStats.rawDailyProfit, profitStats.rawMonthlyProfit, formatUSD]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {t('home.calculator.title')}
          </CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="mb-4 text-sm text-muted-foreground">
                {t('home.calculator.tip')}
              </div>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="pool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('home.calculator.pool')}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="qli" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t('home.calculator.pool_qli')}
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="apool" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t('home.calculator.pool_apool')}
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hashRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          {t('home.calculator.hashRate')}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              className="pr-12"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm">
                              {t('home.calculator.hashRateUnit')}
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="blocks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          {t('home.calculator.blocks')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="powerConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          {t('home.calculator.powerConsumption')}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              className="pr-12"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm">
                              {t('home.calculator.powerConsumptionUnit')}
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="electricityRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {t('home.calculator.electricityRate')}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              className="pr-12"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm">
                              {t('home.calculator.electricityRateUnit')}
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-17rem)]">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4" />
                {t('home.calculator.basicInfo')}
              </h4>
              <div className="space-y-2">
                <StatItem
                  icon={<Timer className="h-4 w-4" />}
                  label={t('home.calculator.hashRate')}
                  value={`${hashRate.toLocaleString()} ${t('home.calculator.hashRateUnit')}`}
                />
                <StatItem
                  icon={<Timer className="h-4 w-4" />}
                  label={t('home.calculator.blocks')}
                  value={blocks.toString()}
                />
                <StatItem
                  icon={<Timer className="h-4 w-4" />}
                  label={t('home.calculator.expectedDailyBlocks')}
                  value={expectedDailyBlocks.toFixed(2)}
                />
                <StatItem
                  icon={<Timer className="h-4 w-4" />}
                  label={t('home.calculator.luck')}
                  value={`${luck.toFixed(2)}%`}
                  valueColor={luck < 100 ? "text-red-500" : "text-green-500"}
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
                  icon={<Zap className="h-4 w-4" />}
                  label={t('home.calculator.powerConsumption')}
                  value={costStats.powerConsumptionDisplay}
                />
                <StatItem
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t('home.calculator.electricityRate')}
                  value={costStats.electricityRateDisplay}
                />
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
                  valueColor={profitStats.rawDailyProfit - (powerConsumption * 24) / 1000 * electricityRate < 0 ? "text-red-500" : "text-green-500"}
                />
                <StatItem
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t('home.calculator.monthlyNetIncome')}
                  value={costStats.monthlyNetIncome}
                  valueColor={profitStats.rawMonthlyProfit - (powerConsumption * 24 * 30) / 1000 * electricityRate < 0 ? "text-red-500" : "text-green-500"}
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
