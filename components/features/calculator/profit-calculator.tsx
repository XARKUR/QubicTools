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
// import { Button } from "@/components/ui/button"
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
import { TimePicker } from "@/components/ui/time-picker"

interface NetworkStats {
  solutionsPerHourCalculated: number;
  networkHashRate: number;
  averageHashrate: number;
  averageApoolHashrate: number;
  price: number;
  apoolStats: any;
  minerlabStats: any;
  nevermineStats: any;
  solutionsStats: any;
  poolHashrate: {
    average: {
      average_qli_hashrate: number;
      average_apool_hashrate: number;
      average_minerlab_hashrate: number;
      average_nevermine_hashrate: number;
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
    nevermineStats: null,
    solutionsStats: null,
    poolHashrate: {
      average: {
        average_qli_hashrate: 0,
        average_apool_hashrate: 0,
        average_minerlab_hashrate: 0,
        average_nevermine_hashrate: 0,
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
  const [startDate, setStartDate] = useState<Date>();

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
      nevermineStats: qubicData.nevermineStats,
      solutionsStats: qubicData.solutionsStats,
      poolHashrate: {
        average: {
          average_qli_hashrate: qubicData.poolHashrate?.average?.average_qli_hashrate,
          average_apool_hashrate: qubicData.poolHashrate?.average?.average_apool_hashrate,
          average_minerlab_hashrate: qubicData.poolHashrate?.average?.average_minerlab_hashrate,
          average_nevermine_hashrate: qubicData.poolHashrate?.average?.average_nevermine_hashrate,
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

    const profitStats = useMemo(() => {
      if (!networkStats || !formData.pool || formData.pool === 'placeholder') {
        return {
          performance: 0,
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

    // 检查当前选择的矿池数据是否可用
    const isPoolDataAvailable = () => {
      switch (formData.pool) {
        case 'qli':
          return networkStats.poolHashrate?.average?.average_qli_hashrate > 0;
        case 'apool':
          return networkStats.apoolStats?.pool_hash > 0;
        case 'minerlab':
          return networkStats.minerlabStats?.pool_hash > 0;
        case 'nevermine':
          return networkStats.nevermineStats?.pool_hash > 0;
        case 'solutions':
          return networkStats.solutionsStats?.pool_hash > 0;
        default:
          return false;
      }
    };

    if (!isPoolDataAvailable()) {
      throw new Error(t('calculator.calculator.error.poolDataUnavailable'));
      return {
        performance: 0,
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
      averageQliHashrate: networkStats.poolHashrate?.average?.average_qli_hashrate ?? 0,
      averageApoolHashrate: networkStats.poolHashrate?.average?.average_apool_hashrate ?? 0,
      averageMinerlabHashrate: networkStats.poolHashrate?.average?.average_minerlab_hashrate ?? 0,
      averageNevermineHashrate: networkStats.poolHashrate?.average?.average_nevermine_hashrate ?? 0,
      averageSolutionsHashrate: networkStats.poolHashrate?.average?.average_solutions_hashrate ?? 0,
      apoolStats: networkStats.apoolStats,
      minerlabStats: networkStats.minerlabStats,
      nevermineStats: networkStats.nevermineStats,
      solutionsStats: networkStats.solutionsStats,
    };

    const result = MiningCalculator.calculateProfit({
      pool: formData.pool,
      miningMode: (formData.miningMode ?? POOL_CONFIGS[formData.pool].defaultMode ?? 'solo') as MiningMode,
      blocks: Number(blocks) || 0,
      networkData,
      hashRate: Number(formData.hashRate) || 0,
      currency: i18n.language === 'zh' ? 'cny' : 'usd'
    });

    const dailyBlocks = result.expectedDailyBlocks;
    const expectedCurrentBlocks = MiningCalculator.calculateCurrentEpochBlocks({
      dailyBlocks,
      startDate
    });

    const dailyCosts = MiningCalculator.calculateCosts(
      Number(formData.power || 0),
      Number(formData.electricityPrice || 0)
    );

    const monthlyCosts = dailyCosts * 30;

    // 计算当前收益
    const currentProfit = result.fiatValue;
    // 计算每日收益
    const dailyProfit = result.expectedDailyFiatValue;
    // 计算每月收益
    const monthlyProfit = dailyProfit * 30;

    // 计算每日净收益（考虑汇率转换）
    let dailyNetProfit = 0;
    if (Number(formData.hashRate) > 0) {
      // 如果是中文，需要把 USD 收益转换为 CNY
      const dailyProfitInLocalCurrency = i18n.language === 'zh' ? 
        result.expectedDailyFiatValue * rates.cny : 
        result.expectedDailyFiatValue;
      dailyNetProfit = dailyProfitInLocalCurrency - (dailyCosts || 0);
    } else if (dailyCosts) {
      dailyNetProfit = -dailyCosts;
    }

    // 计算每月净收益
    const monthlyNetProfit = dailyNetProfit * 30;

    return {
      performance: MiningCalculator.calculatePerformance(Number(formData.blocks || 0), expectedCurrentBlocks),
      totalCoins: result.totalCoins,
      expectedDailyBlocks: dailyBlocks,
      expectedCurrentBlocks,
      currentProfit,
      dailyProfit,
      monthlyProfit,
      dailyCosts,
      monthlyCosts,
      dailyNetProfit,
      monthlyNetProfit,
    };
  }, [networkStats, formData, i18n.language, startDate, rates.cny, blocks, t]);

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
            {t('calculator.calculator.title')}
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
                <SelectValue placeholder={t('calculator.calculator.pool_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>
                  {t('calculator.calculator.pool_placeholder')}
                </SelectItem>
                <SelectItem value="qli">
                  {t('calculator.calculator.pool_qli')}
                </SelectItem>
                <SelectItem value="minerlab">
                  {t('calculator.calculator.pool_minerlab')}
                </SelectItem>
                <SelectItem value="apool">
                  {t('calculator.calculator.pool_apool')}
                </SelectItem>
                <SelectItem value="solutions">
                  {t('calculator.calculator.pool_solutions')}
                </SelectItem>
                <SelectItem value="nevermine">
                  {t('calculator.calculator.pool_nevermine')}
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
                {t('calculator.calculator.baseData')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pickaxe className="h-4 w-4" />
                    <Label>{t('calculator.calculator.miningMode')}</Label>
                  </div>
                  <div className="relative w-36">
                    <Select
                      value={formData.miningMode}
                      onValueChange={(value: MiningMode) => form.setValue('miningMode', value)}
                      disabled={formData.pool === 'placeholder'}
                    >
                      <SelectTrigger className="relative w-36 h-8">
                        <SelectValue placeholder={t('calculator.calculator.mode_placeholder')} />
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
                    <Label>{t('calculator.calculator.hashRate')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            {t('calculator.calculator.pattern.hashRate.tooltip')}
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
                      {t('calculator.calculator.blocks')}
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
                    <Label>{t('calculator.calculator.power')}</Label>
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
                      <span className="text-sm text-muted-foreground">{t('calculator.calculator.powerUnit')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('calculator.calculator.electricityPrice')}</Label>
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
                      <span className="text-sm text-muted-foreground">{t('calculator.calculator.electricityPriceUnit')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  {t('calculator.calculator.miningInfo')}
                </div>
                <TimePicker
                  date={startDate}
                  setDate={setStartDate}
                />
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <Label>{t('calculator.calculator.performance')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            {t('calculator.calculator.pattern.performance.tooltip')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className={cn("font-medium", profitStats.performance < 100 ? "text-red-500" : "text-green-500")}>{`${profitStats.performance.toFixed(2)}%`}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    <Label>{t('calculator.calculator.expectedCurrentCoins')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            {t('calculator.calculator.pattern.expectedCurrentCoins.tooltip')}
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
                    <Label>{t('calculator.calculator.expectedCurrentBlocks')}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            {t('calculator.calculator.pattern.expectedCurrentBlocks.tooltip')}
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
                    <Label>{t('calculator.calculator.expectedDailyBlocks')}</Label>
                  </div>
                  <span className="font-medium">{profitStats.expectedDailyBlocks.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('calculator.calculator.profitAnalysis')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">
                        {t('calculator.calculator.pattern.profitAnalysis.tooltip')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('calculator.calculator.currentProfit')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language === 'zh' ? formatCNY(profitStats.currentProfit) : formatUSD(profitStats.currentProfit)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('calculator.calculator.dailyProfit')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language === 'zh' ? formatCNY(profitStats.dailyProfit) : formatUSD(profitStats.dailyProfit)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('calculator.calculator.weeklyProfit')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language === 'zh' ? formatCNY(profitStats.dailyProfit * 7) : formatUSD(profitStats.dailyProfit * 7)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('calculator.calculator.monthlyProfit')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language === 'zh' ? formatCNY(profitStats.monthlyProfit) : formatUSD(profitStats.monthlyProfit)}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('calculator.calculator.costAnalysis')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('calculator.calculator.dailyPowerCost')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language === 'zh' ? `¥${dailyPowerCost.toFixed(2)}` : `$${dailyPowerCost.toFixed(2)}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('calculator.calculator.monthlyPowerCost')}</Label>
                  </div>
                  <span className="font-medium">{i18n.language === 'zh' ? `¥${monthlyPowerCost.toFixed(2)}` : `$${monthlyPowerCost.toFixed(2)}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('calculator.calculator.dailyNetIncome')}</Label>
                  </div>
                  <span className={cn("font-medium", profitStats.dailyNetProfit < 0 ? "text-red-500" : "text-green-500")}>
                    {i18n.language === 'zh' ? `¥${profitStats.dailyNetProfit.toFixed(2)}` : `$${profitStats.dailyNetProfit.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>{t('calculator.calculator.monthlyNetIncome')}</Label>
                  </div>
                  <span className={cn("font-medium", profitStats.monthlyNetProfit < 0 ? "text-red-500" : "text-green-500")}>
                    {i18n.language === 'zh' ? `¥${profitStats.monthlyNetProfit.toFixed(2)}` : `$${profitStats.monthlyNetProfit.toFixed(2)}`}
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