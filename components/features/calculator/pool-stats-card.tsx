"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress, EpochProgress } from "@/components/ui/progress"
import { useTranslation } from "react-i18next"
import { FileQuestion, Activity, Pickaxe, Hourglass, FileCheck, Star, HelpCircle } from "lucide-react"
import { formatHashRate } from "@/lib/utils"
import { useQubicData } from "@/providers/qubic-data-provider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { MiningCalculator } from "@/services/mining-calculator"
import { useExchangeRate } from '@/hooks/useExchangeRate'

interface PoolStats {
  name: string
  accepted_solution: number
  corrected_hashrate: number
  pool_hash: number
  shares_per_solution?: number
  total_share?: number
  pplns_solutions?: number
  solo_solutions?: number
}

interface DisplayItem {
  key: keyof PoolStats | 'hashrate_per_solution' | 'coins_per_block' | 'block_value' | 'accepted_solution' | 'corrected_hashrate' | 'pool_hash' | 'shares_per_solution' | 'total_share';
  label: string | JSX.Element;
  format?: ((value: number) => string) | (() => string);
}

interface PoolDisplay {
  name: string
  stats: PoolStats
  percentage: number
  icon: React.ReactNode
  displayItems: DisplayItem[]
}

interface PoolStatsCardProps {
  apool?: PoolStats
  minerlab?: PoolStats
  nevermine?: PoolStats
}

export const PoolStatsCard = memo(function PoolStatsCard({ apool, minerlab, nevermine }: PoolStatsCardProps) {
  const { t, i18n } = useTranslation()
  const { data: qubicData, isLoading } = useQubicData()
  const { formatUSD, formatCNY } = useExchangeRate()

  if (isLoading || !apool || !minerlab || !nevermine || !qubicData) {
    return (
      <Card className="p-4">
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-base">{t('calculator.poolStats.noData.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('calculator.poolStats.noData.description')}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const calculatePercentage = (stats: PoolStats) => {
    return stats.corrected_hashrate > 0 ? Number((stats.pool_hash / stats.corrected_hashrate * 100).toFixed(2)) : 0
  }

  // 计算每小时平均出块数
  const solutionsPerHour = qubicData.solutionsPerHourCalculated || 0
  // 计算平均分数 = 平均每小时出块数 * 168 / 676
  const averageScore = Math.round((solutionsPerHour * 168) / 676)

  // 提取时间计算到独立变量
  const currentUtcDay = new Date().getUTCDay();
  const currentUtcHour = new Date().getUTCHours();
  const currentUtcMinute = new Date().getUTCMinutes();

  // 计算纪元进度
  const calculateEpochProgress = () => {
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
  };

  const epochProgress = calculateEpochProgress();

  // 获取总提案数
  const totalProposals = Array.isArray(qubicData.proposal) ? qubicData.proposal.length : 0

  const getValue = (stats: PoolStats, key: keyof PoolStats | string): number => {
    const value = stats[key as keyof PoolStats]
    return typeof value === 'number' ? value : 0
  }

  const calculateHashRatePerSolution = (stats: PoolStats, poolName: string) => {
    if (!stats || !qubicData?.solutionsPerHourCalculated) return 0

    // 根据矿池名称获取对应的平均算力
    let averageHashrate = 0
    switch (poolName.toLowerCase()) {
      case 'apool':
        averageHashrate = qubicData.averageApoolHashrate
        break
      case 'minerlab':
        averageHashrate = qubicData.averageMinerlabHashrate
        break
      case 'nevermine':
        averageHashrate = qubicData.averageNevermineHashrate
        break
      default:
        return 0
    }

    // 对于其他有 shares 系统的矿池
    if (!stats.shares_per_solution || !stats.total_share || !stats.pplns_solutions) {
      const solutionsPerDay = qubicData.solutionsPerHourCalculated * 24
      return solutionsPerDay > 0 ? averageHashrate / solutionsPerDay : 0
    }

    // 计算每个share需要的算力
    const timeWindowHours = 24
    const sharesPerHour = stats.total_share / timeWindowHours
    const hashRatePerShare = averageHashrate / sharesPerHour

    // 每个solution需要的shares数量
    const sharesPerSolution = stats.shares_per_solution

    // 返回每个solution需要的算力
    return hashRatePerShare * sharesPerSolution
  }

  const calculateCoinsPerBlock = (poolName: string) => {
    if (!qubicData?.solutionsPerHourCalculated) return 0

    const coinsPerBlock = (() => {
      switch (poolName.toLowerCase()) {
        case 'minerlab':
          return MiningCalculator.calculateMinerlabBlockCoins(qubicData.solutionsPerHourCalculated)
        case 'apool':
          return MiningCalculator.calculateApoolPplnsBlockCoins(qubicData.solutionsPerHourCalculated)
        case 'nevermine':
          return MiningCalculator.calculateNeverminePplnsBlockCoins(qubicData.solutionsPerHourCalculated)
        default:
          return 0
      }
    })()

    return Number(coinsPerBlock.toFixed(8)) || 0
  }

  const formatBlockValue = (coinsPerBlock: number) => {
    if (!qubicData) return i18n.language === 'zh' ? formatCNY(0) : formatUSD(0)
    
    // Ensure price is a number and handle string conversion
    const price = typeof qubicData.price === 'string' 
      ? parseFloat(qubicData.price) 
      : (qubicData.price || 0)
    
    // Calculate block value: coins per block * price
    const blockValue = coinsPerBlock * price
    
    // Format based on language preference
    return i18n.language === 'zh' 
      ? formatCNY(blockValue)
      : formatUSD(blockValue)
  }

  const pools = ([
    {
      name: 'Minerlab',
      stats: minerlab,
      percentage: calculatePercentage(minerlab),
      icon: <Star className="h-4 w-4" />,
      displayItems: [
        {
          key: 'pool_hash',
          label: t('calculator.poolStats.poolHash'),
          format: (value: number) => formatHashRate(value)
        },
        {
          key: 'accepted_solution',
          label: t('calculator.poolStats.solutions')
        },
        {
          key: 'shares_per_solution',
          label: t('calculator.poolStats.sharesPerSolution')
        },
        {
          key: 'coins_per_block',
          label: t('calculator.poolStats.coinsPerBlock'),
          format: () => calculateCoinsPerBlock('minerlab').toFixed(0)
        },
        {
          key: 'block_value',
          label: t('calculator.poolStats.blockValue'),
          format: () => formatBlockValue(calculateCoinsPerBlock('minerlab'))
        },
        {
          key: 'hashrate_per_solution',
          label: (
            <div className="flex items-center gap-1">
              <span>{t('calculator.poolStats.hashratePerSolution.title')}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('calculator.poolStats.hashratePerSolution.tooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ),
          format: (value: number) => formatHashRate(value)
        }
      ]
    },
    {
      name: 'Nevermine',
      stats: nevermine,
      percentage: calculatePercentage(nevermine),
      icon: <FileCheck className="h-4 w-4" />,
      displayItems: [
        {
          key: 'pool_hash',
          label: t('calculator.poolStats.poolHash'),
          format: (value: number) => formatHashRate(value)
        },
        {
          key: 'accepted_solution',
          label: t('calculator.poolStats.solutions')
        },
        {
          key: 'shares_per_solution',
          label: t('calculator.poolStats.sharesPerSolution')
        },
        {
          key: 'coins_per_block',
          label: t('calculator.poolStats.coinsPerBlock'),
          format: () => calculateCoinsPerBlock('nevermine').toFixed(0)
        },
        {
          key: 'block_value',
          label: t('calculator.poolStats.blockValue'),
          format: () => formatBlockValue(calculateCoinsPerBlock('nevermine'))
        },
        {
          key: 'hashrate_per_solution',
          label: (
            <div className="flex items-center gap-1">
              <span>{t('calculator.poolStats.hashratePerSolution.title')}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('calculator.poolStats.hashratePerSolution.tooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ),
          format: (value: number) => formatHashRate(value)
        }
      ]
    },
    {
      name: 'Apool',
      stats: apool,
      percentage: calculatePercentage(apool),
      icon: <Activity className="h-4 w-4" />,
      displayItems: [
        {
          key: 'pool_hash',
          label: t('calculator.poolStats.poolHash'),
          format: (value: number) => formatHashRate(value)
        },
        {
          key: 'accepted_solution',
          label: t('calculator.poolStats.solutions')
        },
        {
          key: 'shares_per_solution',
          label: t('calculator.poolStats.sharesPerSolution')
        },
        {
          key: 'coins_per_block',
          label: t('calculator.poolStats.coinsPerBlock'),
          format: () => calculateCoinsPerBlock('apool').toFixed(0)
        },
        {
          key: 'block_value',
          label: t('calculator.poolStats.blockValue'),
          format: () => formatBlockValue(calculateCoinsPerBlock('apool'))
        },
        {
          key: 'hashrate_per_solution',
          label: (
            <div className="flex items-center gap-1">
              <span>{t('calculator.poolStats.hashratePerSolution.title')}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('calculator.poolStats.hashratePerSolution.tooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ),
          format: (value: number) => formatHashRate(value)
        }
      ]
    },
  ].sort((a, b) => b.percentage - a.percentage)) as PoolDisplay[]

  //const isIdle = qubicData.idle

  return (
    <div className="space-y-4">
      <Card className="h-full flex flex-col border-border/50 hover:border-border/80 transition-colors">
        <CardHeader className="border-b py-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {t('calculator.poolStats.epochData')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Epoch Progress */}
            <div className="space-y-2">
            <EpochProgress
                  value={epochProgress}
                  className="h-2 w-full mb-4"
                />
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Hourglass className="h-4 w-4" />
                  <Label>{t('calculator.poolStats.epochProgress')}</Label>
                </div>
                <span className="text-sm font-medium">{epochProgress.toFixed(2)}%</span>
              </div>
            </div>

            {/* Idle Status */}
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">
                <Pickaxe className="h-4 w-4" />
                <Label>{t('calculator.poolStats.idle.title')}</Label>
              </div>

              <span className={cn(
                "text-sm font-medium",
                qubicData.idle ? "text-green-500" : "text-destructive"
              )}>
                {qubicData.idle ? t('calculator.poolStats.idle.yes') : t('calculator.poolStats.idle.no')}
              </span>
            </div>
            
            {/* Total Proposals */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                <Label>{t('calculator.poolStats.proposals')}</Label>
              </div>
              <a href="./" rel="noopener noreferrer" className="text-sm font-medium">{totalProposals}</a>
            </div>

            {/* Average Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <Label>{t('calculator.poolStats.averageScore')}</Label>
              </div>
              <span className="text-sm font-medium">{averageScore}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols gap-4">
        {pools.map((pool) => (
          <Card key={pool.name} className="w-full">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{pool.name}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">
                          {t('calculator.poolStats.corrected_hashrate.tooltip')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span>{formatHashRate(pool.stats.corrected_hashrate)}</span>
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('calculator.poolStats.networkShare')}</span>
                  <span>{pool.percentage === 0 ? '0.00' : pool.percentage.toFixed(2)}%</span>
                </div>
                <Progress value={pool.percentage} className="h-1.5" />
              </div>

              <div className="flex flex-col gap-2">
                {pool.displayItems.map((item) => {
                  const value = item.key === 'hashrate_per_solution'
                    ? calculateHashRatePerSolution(pool.stats, pool.name)
                    : item.key === 'coins_per_block'
                      ? calculateCoinsPerBlock(pool.name)
                      : getValue(pool.stats, item.key)

                  // Hide shares per solution if value is 0
                  if (item.key === 'shares_per_solution' && value === 0) {
                    return null
                  }

                  return (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label className="text-muted-foreground">
                        {item.label}
                      </Label>
                      <span className="text-sm font-medium">
                        {item.format ? item.format(value) : value}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
})
