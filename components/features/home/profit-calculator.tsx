import { memo, useMemo, useEffect, useState } from "react"
import { useTranslation } from 'react-i18next'
import {
  Calculator,
  Timer,
  Zap,
  Cpu,
  Box,
  Boxes,
  Coins,
  Pickaxe,
  Settings,
  Sparkles,
  HelpCircle,
  Hourglass,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useQubicData } from "@/providers/qubic-data-provider";
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { 
  MiningCalculator, 
  miningCalculatorFormSchema, 
  type MiningCalculatorFormData,
  type PoolOption,
  type MiningMode,
  POOL_CONFIGS
} from '@/services/mining-calculator';

interface NetworkStats {
  solutionsPerHourCalculated: number;
  networkHashRate: number;
  averageHashrate: number;
  averageApoolHashrate: number;
  price: number;
  apoolStats: any;
  minerlabStats: any;
  solutionsStats: any;
  poolHashrate: {
    average: {
      average_qli_hashrate: number;
      average_apool_hashrate: number;
      average_minerlab_hashrate: number;
      average_solutions_hashrate: number;
    }
  }
}

/**
 * Mining Calculator Component
 * @component
 * @example
 * ```tsx
 * <ProfitCalculator />
 * ```
 */
export const ProfitCalculator = memo(function ProfitCalculatorComponent() {
  const { t, i18n } = useTranslation();
  const { rates, formatUSD, formatCNY } = useExchangeRate();
  const { data: qubicData } = useQubicData();
  
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    solutionsPerHourCalculated: 0,
    networkHashRate: 0,
    averageHashrate: 0,
    averageApoolHashrate: 0,
    price: 0,
    apoolStats: null,
    minerlabStats: null,
    solutionsStats: null,
    poolHashrate: {
      average: {
        average_qli_hashrate: 0,
        average_apool_hashrate: 0,
        average_minerlab_hashrate: 0,
        average_solutions_hashrate: 0,
      }
    }
  });

  const form = useForm<MiningCalculatorFormData>({
    resolver: zodResolver(miningCalculatorFormSchema),
    defaultValues: {
      hashRate: '',
      power: '',
      electricityPrice: '',
      blocks: '',
      pool: 'placeholder',
      miningMode: undefined
    }
  });

  const { watch } = form;
  const formData = watch();
  const [hashRate, setHashRate] = useState(formData.hashRate || '');
  const [blocks, setBlocks] = useState(formData.blocks || '');
  const [power, setPower] = useState(formData.power || '');
  const [electricityPrice, setElectricityPrice] = useState(formData.electricityPrice || '');

  useEffect(() => {
    if (!qubicData) return;

    setNetworkStats({
      solutionsPerHourCalculated: qubicData.solutionsPerHourCalculated,
      networkHashRate: qubicData.networkHashRate,
      averageHashrate: qubicData.averageHashrate,
      averageApoolHashrate: qubicData.averageApoolHashrate,
      price: qubicData.price,
      apoolStats: qubicData.apoolStats,
      minerlabStats: qubicData.minerlabStats,
      solutionsStats: qubicData.solutionsStats,
      poolHashrate: {
        average: {
          average_qli_hashrate: qubicData.poolHashrate?.average?.average_qli_hashrate,
          average_apool_hashrate: qubicData.poolHashrate?.average?.average_apool_hashrate,
          average_minerlab_hashrate: qubicData.poolHashrate?.average?.average_minerlab_hashrate,
          average_solutions_hashrate: qubicData.poolHashrate?.average?.average_solutions_hashrate,
        }
      }
    });
  }, [qubicData]);

  useEffect(() => {
    if (!qubicData) return;

    form.setValue("hashRate", hashRate);
    form.setValue("blocks", blocks);
    form.setValue("power", power);
    form.setValue("electricityPrice", electricityPrice);
  }, [form, hashRate, blocks, power, electricityPrice, qubicData]);

  // 提取时间计算到独立变量
  const currentUtcDay = useMemo(() => new Date().getUTCDay(), []);
  const currentUtcHour = useMemo(() => new Date().getUTCHours(), []);
  const currentUtcMinute = useMemo(() => new Date().getUTCMinutes(), []);

  // 计算纪元进度
  const epochProgress = useMemo(() => {
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
    return (hoursSinceEpochStart / (7 * 24)) * 100;
  }, [currentUtcDay, currentUtcHour, currentUtcMinute]);

  const profitStats = useMemo(() => {
    if (!networkStats || !formData.pool || formData.pool === 'placeholder') {
      return {
        luck: 0,
        totalCoins: 0,
        expectedDailyBlocks: 0,
        expectedCurrentBlocks: 0,
        currentProfit: 0,
        dailyProfit: 0,
        monthlyProfit: 0,
        dailyCosts: 0,
        monthlyCosts: 0,
        dailyNetProfit: 0,
        monthlyNetProfit: 0,
      };
    }

    const networkData = {
      solutionsPerHourCalculated: networkStats.solutionsPerHourCalculated,
      price: networkStats.price,
      averageQliHashrate: networkStats.poolHashrate.average.average_qli_hashrate,
      averageApoolHashrate: networkStats.poolHashrate.average.average_apool_hashrate,
      averageMinerlabHashrate: networkStats.poolHashrate.average.average_minerlab_hashrate,
      averageSolutionsHashrate: networkStats.poolHashrate.average.average_solutions_hashrate,
      apoolStats: networkStats.apoolStats,
      minerlabStats: networkStats.minerlabStats,
      solutionsStats: networkStats.solutionsStats
    };

    try {
      // 计算预期收益（只需要算力）
      const result = MiningCalculator.calculateProfit({
        pool: formData.pool as PoolOption,
        miningMode: (formData.miningMode || POOL_CONFIGS[formData.pool]?.defaultMode || "solo") as MiningMode,
        blocks: Number(blocks) || 0,
        networkData,
        hashRate: Number(formData.hashRate) || 0,
        currency: i18n.language.toLowerCase() === 'zh' ? 'cny' : 'usd'
      });

      // 计算电费成本（只需要功耗和电价）
      const costs = MiningCalculator.calculateCosts(
        Number(formData.power) || 0,
        Number(formData.electricityPrice) || 0
      );

      const dailyBlocks = result.expectedDailyBlocks;
      const currentBlocks = MiningCalculator.calculateCurrentEpochBlocks(dailyBlocks);

      // 计算当前收益（需要已出块数）
      const currentProfit = Number(blocks) > 0 ? result.fiatValue : 0;

      // 计算预期每日收益（只需要算力）
      const dailyProfit = Number(formData.hashRate) > 0 ? result.expectedDailyFiatValue : 0;
      const monthlyProfit = dailyProfit * 30;

      // 计算每日和每月成本（只需要功耗和电价）
      const dailyCosts = (Number(formData.power) > 0 && Number(formData.electricityPrice) > 0) ? costs : 0;
      const monthlyCosts = dailyCosts * 30;

      // 计算净收益
      let dailyNetProfit = 0;
      if (Number(formData.hashRate) > 0) {
        // 如果是中文，需要把 USD 收益转换为 CNY
        const dailyProfitInLocalCurrency = i18n.language.toLowerCase() === 'zh' ? 
          result.expectedDailyFiatValue * rates.cny : 
          result.expectedDailyFiatValue;
        dailyNetProfit = dailyProfitInLocalCurrency - (dailyCosts || 0);
      } else if (dailyCosts) {
        dailyNetProfit = -dailyCosts;
      }
      
      const monthlyNetProfit = dailyNetProfit * 30;

      return {
        luck: MiningCalculator.calculateLuck(Number(blocks) || 0, currentBlocks),
        totalCoins: result.totalCoins,
        expectedDailyBlocks: dailyBlocks,
        expectedCurrentBlocks: currentBlocks,
        currentProfit,
        dailyProfit,
        monthlyProfit,
        dailyCosts,
        monthlyCosts,
        dailyNetProfit,
        monthlyNetProfit,
      };
    } catch (error) {
      console.error('Error calculating profit:', error);
      return {
        luck: 0,
        totalCoins: 0,
        expectedDailyBlocks: 0,
        expectedCurrentBlocks: 0,
        currentProfit: 0,
        dailyProfit: 0,
        monthlyProfit: 0,
        dailyCosts: 0,
        monthlyCosts: 0,
        dailyNetProfit: 0,
        monthlyNetProfit: 0,
      };
    }
  }, [networkStats, formData, blocks, i18n.language]);

  const dailyPowerCost = useMemo(() => {
    if (!networkStats) return 0;
    return (Number(power) * 24) / 1000 * Number(electricityPrice);
  }, [power, electricityPrice, networkStats]);

  const monthlyPowerCost = useMemo(() => {
    return dailyPowerCost * 30;
  }, [dailyPowerCost]);

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
              onValueChange={(value: PoolOption) => {
                form.setValue('pool', value);
                // 重置挖矿模式
                if (value !== 'placeholder') {
                  form.setValue('miningMode', (POOL_CONFIGS[value].defaultMode || undefined) as MiningMode | undefined);
                } else {
                  form.setValue('miningMode', undefined);
                }
              }}
            >
              <SelectTrigger className="w-36 h-8">
                <SelectValue placeholder={t('home.calculator.pool_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>
                  {t('home.calculator.pool_placeholder')}
                </SelectItem>
                <SelectItem value="qli">
                  {t('home.calculator.pool_qli')}
                </SelectItem>
                <SelectItem value="minerlab">
                  {t('home.calculator.pool_minerlab')}
                </SelectItem>
                <SelectItem value="apool">
                  {t('home.calculator.pool_apool')}
                </SelectItem>
                <SelectItem value="solutions">
                  {t('home.calculator.pool_solutions')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-21rem)]">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('home.calculator.baseData')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pickaxe className="h-4 w-4" />
                    <Label>{t('home.calculator.miningMode')}</Label>
                  </div>
                  <div className="relative w-36">
                    <Select
                      value={formData.miningMode}
                      onValueChange={(value: MiningMode) => form.setValue('miningMode', value)}
                      disabled={formData.pool === 'placeholder'}
                    >
                      <SelectTrigger className="relative w-36 h-8">
                        <SelectValue placeholder={t('home.calculator.mode_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.pool !== 'placeholder' && Object.entries(POOL_CONFIGS[formData.pool].modes).map(([mode, config]) => (
                          <SelectItem key={mode} value={mode}>
                            {config.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    <Label>{t('home.calculator.hashRate')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            {t('home.calculator.pattern.hashRate.tooltip')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="relative w-36">
                    <Input
                      type="number"
                      placeholder="0"
                      value={hashRate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setHashRate(value);
                        form.setValue('hashRate', value);
                      }}
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
                      {formData.miningMode === "pplns" ? " (Shares)" : " (Solutions)"}
                    </Label>
                  </div>
                  <Input
                    id="blocks"
                    type="number"
                    placeholder="0"
                    value={blocks}
                    onChange={(e) => {
                      const value = e.target.value;
                      setBlocks(value);
                      form.setValue('blocks', value);
                    }}
                    className="w-36 h-8"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <Label>{t('home.calculator.power')}</Label>
                  </div>
                  <div className="relative w-36">
                    <Input
                      type="number"
                      placeholder="0"
                      value={power}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPower(value);
                        form.setValue('power', value);
                      }}
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
                  <div className="relative w-36">
                    <Input
                      type="number"
                      placeholder="0"
                      value={electricityPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        setElectricityPrice(value);
                        form.setValue('electricityPrice', value);
                      }}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <Label>{t('home.calculator.luck')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            {t('home.calculator.pattern.luck.tooltip')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className={cn("font-medium", profitStats.luck < 100 ? "text-red-500" : "text-green-500")}>{`${profitStats.luck.toFixed(2)}%`}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hourglass className="h-4 w-4" />
                    <Label>{t('home.calculator.epochProgress')}</Label>
                  </div>
                  <span className="font-medium">{`${epochProgress.toFixed(2)}%`}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    <Label>{t('home.calculator.expectedCurrentCoins')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            {t('home.calculator.pattern.expectedCurrentCoins.tooltip')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-medium">{profitStats.totalCoins.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4" />
                    <Label>{t('home.calculator.expectedCurrentBlocks')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            {t('home.calculator.pattern.expectedCurrentBlocks.tooltip')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-medium">{profitStats.expectedCurrentBlocks.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    <Label>{t('home.calculator.expectedDailyBlocks')}</Label>
                  </div>
                  <span className="font-medium">{profitStats.expectedDailyBlocks.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('home.calculator.profitAnalysis')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">
                        {t('home.calculator.pattern.profitAnalysis.tooltip')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('home.calculator.currentProfit')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language.toLowerCase() === 'zh' ? formatCNY(profitStats.currentProfit) : formatUSD(profitStats.currentProfit)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('home.calculator.dailyProfit')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language.toLowerCase() === 'zh' ? formatCNY(profitStats.dailyProfit) : formatUSD(profitStats.dailyProfit)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('home.calculator.weeklyProfit')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language.toLowerCase() === 'zh' ? formatCNY(profitStats.dailyProfit * 7) : formatUSD(profitStats.dailyProfit * 7)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('home.calculator.monthlyProfit')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language.toLowerCase() === 'zh' ? formatCNY(profitStats.monthlyProfit) : formatUSD(profitStats.monthlyProfit)}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('home.calculator.costAnalysis')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('home.calculator.dailyPowerCost')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language.toLowerCase() === 'zh' ? `¥${dailyPowerCost.toFixed(2)}` : `$${dailyPowerCost.toFixed(2)}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('home.calculator.monthlyPowerCost')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language.toLowerCase() === 'zh' ? `¥${monthlyPowerCost.toFixed(2)}` : `$${monthlyPowerCost.toFixed(2)}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('home.calculator.dailyNetIncome')}</Label>
                  </div>
                  <span className={cn("font-medium", profitStats.dailyNetProfit < 0 ? "text-red-500" : "text-green-500")}>
                    {i18n.language.toLowerCase() === 'zh' ? `¥${profitStats.dailyNetProfit.toFixed(2)}` : `$${profitStats.dailyNetProfit.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('home.calculator.monthlyNetIncome')}</Label>
                  </div>
                  <span className={cn("font-medium", profitStats.monthlyNetProfit < 0 ? "text-red-500" : "text-green-500")}>
                    {i18n.language.toLowerCase() === 'zh' ? `¥${profitStats.monthlyNetProfit.toFixed(2)}` : `$${profitStats.monthlyNetProfit.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
})

ProfitCalculator.displayName = "ProfitCalculator"