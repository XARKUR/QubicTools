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

export type PoolOption = "placeholder" | "qli" | "apool";

export const profitCalculatorFormSchema = z.object({
  hashRate: z.string(),
  power: z.string(),
  electricityPrice: z.string(),
  blocks: z.string(),
  pool: z.enum(["placeholder", "qli", "apool"]),
});

export type ProfitCalculatorFormData = z.infer<typeof profitCalculatorFormSchema>;

/**
 * 
 * @interface StatItemProps
 * @property {string} label 
 * @property {string} value 
 * @property {React.ReactNode} [icon] 
 * @property {string} [className] 
 * @property {string} [valueColor] 
 */
interface StatItemProps {
  label: string
  value: string
  icon?: React.ReactNode
  className?: string
  valueColor?: string
}

/**
 * 
 * 
 * 
 * @component
 * @param {StatItemProps} props 
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
  averageHashrate: number;        
  averageApoolHashrate: number;   
  blockValueUSD: number;
}

/**
 * 
 */
const getNetworkHashRate = (networkStats: NetworkStats, pool: string): number => {
  return pool === "apool" ? networkStats.averageApoolHashrate : networkStats.averageHashrate;
};

/**
 * 
 * @param {number} hashRate 
 * @param {number} networkHashRate 
 * @param {number} solutionsPerHourCalculated 
 * @returns {number} 
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
 * 
 * @param {number} actualBlocks 
 * @param {number} expectedBlocks 
 * @returns {number} 
 */
const calculateLuck = (actualBlocks: number, expectedBlocks: number): number => {
  if (expectedBlocks === 0) return 0;
  return (actualBlocks / expectedBlocks) * 100;
}

/**
 * 
 * @param {number} powerConsumption 
 * @param {number} electricityRate 
 * @returns {number} 
 */
const calculateCosts = (powerConsumption: number, electricityRate: number): number => {
  return (powerConsumption * 24) / 1000 * electricityRate
}

/**
 * 
 * @param {number} dailyBlocks 
 * @returns {number} 
 */
const calculateCurrentEpochBlocks = (dailyBlocks: number) => {
  const now = new Date();
  const currentDay = now.getUTCDay(); 
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  let daysSinceEpochStart;
  if (currentDay < 3 || (currentDay === 3 && currentHour < 12)) {
    daysSinceEpochStart = currentDay + 7 - 3;
  } else {
    daysSinceEpochStart = currentDay - 3;
  }

  let hoursSinceEpochStart = daysSinceEpochStart * 24;
  if (currentDay === 3) {
    if (currentHour >= 12) {
      hoursSinceEpochStart += (currentHour - 12);
    } else {
      hoursSinceEpochStart += (currentHour + 12);
    }
  } else {
    hoursSinceEpochStart += currentHour;
  }

  const totalHours = hoursSinceEpochStart + (currentMinute / 60);
  
  return (dailyBlocks * totalHours) / 24;
};

/**
 * 
 * 
 * 
 * @param {z.infer<typeof profitCalculatorFormSchema>} formData 
 * @returns {Object} 
 */
const useProfitCalculator = (formData: z.infer<typeof profitCalculatorFormSchema>) => {
  const powerConsumption = parseFloat(formData.power) || 0
  const electricityRate = parseFloat(formData.electricityPrice) || 0
  const blocks = parseFloat(formData.blocks) || 0

  const dailyReward = blocks * 1000 
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
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
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
    averageHashrate: 0,
    averageApoolHashrate: 0,
    blockValueUSD: 0
  });

  const [blockValue, setBlockValue] = useState(0)
  const [apoolRatio, setApoolRatio] = useState<number>(0);

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
          averageHashrate: blockValueData.averageHashrate,
          averageApoolHashrate: blockValueData.averageApoolHashrate,
          solutionsPerHourCalculated: blockValueData.solutionsPerHourCalculated,
          blockValueUSD: blockValueData.blockValueUSD
        });

        const ratio = apoolStatsData.accepted_solution / apoolStatsData.total_share;
        setApoolRatio(ratio || 0);
        setBlockValue(blockValueData.blockValueUSD);
      } catch {
        if (!isMounted) return;
        setNetworkStats({ networkHashRate: 0, averageHashrate: 0, averageApoolHashrate: 0, solutionsPerHourCalculated: 0, blockValueUSD: 0 });
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

  const expectedDailyBlocks = useMemo(() => {
    if (!hashRate || !networkStats.networkHashRate || !networkStats.solutionsPerHourCalculated) return 0;
    
    const currentNetworkHashRate = getNetworkHashRate(networkStats, formData.pool);
    const blocks = calculateDailyBlocks(
      Number(hashRate),
      currentNetworkHashRate,
      networkStats.solutionsPerHourCalculated
    );

    return formData.pool === "apool" && apoolRatio > 0 ? blocks * apoolRatio : blocks;
  }, [hashRate, networkStats, formData.pool, apoolRatio]);

  const currentEpochBlocks = useMemo(() => {
    return calculateCurrentEpochBlocks(expectedDailyBlocks);
  }, [expectedDailyBlocks]);

  const luck = calculateLuck(Number(blocks), currentEpochBlocks);

  const baseStats = useProfitCalculator(formData);

  const { formatCurrency } = useExchangeRate()
  const formatUSD = useCallback((value: number) => {
    return formatCurrency(value)
  }, [formatCurrency]);

  const profitStats = useMemo(() => {
    const calculateBaseProfit = (blocks: number) => {
      let profit = 0;
      if (formData.pool === "qli") {
        profit = blocks * blockValue * 0.8;
      } else if (formData.pool === "apool" && apoolRatio > 0) {
        const shareValue = blockValue / apoolRatio * 0.9;
        profit = blocks * shareValue;
      }
      return profit;
    };

    const currentProfit = calculateBaseProfit(Number(blocks));

    const dailyExpectedProfit = calculateBaseProfit(expectedDailyBlocks);

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

  const costStats = useMemo(() => {
    const powerDisplay = `${power}W`;
    const rateDisplay = formatUSD(Number(electricityPrice));

    const dailyPowerCost = (Number(power) * 24) / 1000 * Number(electricityPrice);
    const monthlyPowerCost = dailyPowerCost * 30;

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
