"use client"

import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useQubicData } from "@/providers/qubic-data-provider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Download } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface EpochData {
  epoch: number
  averageProfit: number
  price: string
  startTime: string
  endTime: string
  averageScore: number
  totalSolutions: number
}

interface MiningMode {
  type: string
  weekProfit: string  // 添加周收益字段
  sharesPerSolution?: number
  coinsPerSolution: Array<{
    estimate: number
    actual: number | null
  }>
}

interface Pool {
  name: string
  miningModes: MiningMode[]
}

interface ApiResponse {
  epoch: number
  startTime: string
  endTime: string
  price: string
  totalSolutions: number
  averageScore: number
  pools: Pool[]
}

// 计算纪元时间
const calculateEpochTimes = (epoch: number) => {
  // 以145纪元为基准点
  const epoch145Start = new Date('2025-01-22T00:00:00Z');
  const EPOCH_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天的毫秒数

  // 计算与145纪元的差值
  const epochDiff = epoch - 145;
  
  // 计算开始时间
  const startTime = new Date(epoch145Start.getTime() + (epochDiff * EPOCH_DURATION));
  
  // 计算结束时间
  const endTime = new Date(startTime.getTime() + EPOCH_DURATION);

  return {
    startTime: startTime.toLocaleDateString('zh-CN'),
    endTime: endTime.toLocaleDateString('zh-CN')
  };
};

const CARD_HEIGHT = "min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]"

export const ContentGridSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 max-w-full overflow-x-hidden">
      <div className="grid grid-cols-12 gap-4">
        {/* 左侧：纪元选择和搜索 */}
        <div className="col-span-12 md:col-span-3">
          <Card className={cn(CARD_HEIGHT, "flex flex-col")}>
            <CardHeader className="pb-2 flex-none">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-4 pt-2">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/50" />
                  <Skeleton className="pl-9 h-8 w-full" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>

              <div className="rounded-lg border px-4 py-3">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：矿池信息表格 */}
        <div className="col-span-12 md:col-span-9">
          <Card className={cn(CARD_HEIGHT, "flex flex-col")}>
            <CardHeader className="pb-2 flex-none">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-auto pt-2">
              <div className="rounded-lg border rounded-lg overflow-hidden">
                <Card className="border-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-3 w-[80px]" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-[200px] w-full mt-4">
                      <Skeleton className="h-full w-full" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4">
                    <Skeleton className="h-4 w-full" />
                  </CardFooter>
                </Card>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="w-[16.67%]">
                        <Skeleton className="h-4 w-full" />
                      </TableHead>
                      <TableHead className="w-[16.67%]">
                        <Skeleton className="h-4 w-full" />
                      </TableHead>
                      <TableHead className="w-[16.67%] text-center">
                        <Skeleton className="h-4 w-full" />
                      </TableHead>
                      <TableHead className="w-[16.67%] text-center">
                        <Skeleton className="h-4 w-full" />
                      </TableHead>
                      <TableHead className="w-[16.67%] text-center">
                        <Skeleton className="h-4 w-full" />
                      </TableHead>
                      <TableHead className="w-[16.67%] text-center">
                        <Skeleton className="h-4 w-full" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr:last-child]:border-0">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="w-[16.67%]">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell className="w-[16.67%]">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell className="w-[16.67%] text-center">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell className="w-[16.67%] text-center">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell className="w-[16.67%] text-center">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell className="w-[16.67%] text-center">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function ContentGrid() {
  const { t } = useTranslation()
  const { data: qubicData } = useQubicData()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [epochsData, setEpochsData] = useState<EpochData[]>([])
  const [searchEpoch, setSearchEpoch] = useState("")
  const [selectedEpoch, setSelectedEpoch] = useState<number | null>(null)
  const [earliestAvailableEpoch, setEarliestAvailableEpoch] = useState<number | null>(null)
  const [latestAvailableEpoch, setLatestAvailableEpoch] = useState<number | null>(null)
  const [miningData, setMiningData] = useState<ApiResponse | null>(null)
  const currentEpoch = qubicData?.currentEpoch || null
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // 修复 JSON 格式的函数
  const fixJsonString = (jsonString: string): string => {
    return jsonString.replace(/,(\s*[}\]])/g, '$1')
  }

  // 计算每个纪元的平均收益（使用 weekProfit）
  const calculateEpochProfit = (pools: Pool[]): number => {
    let totalProfit = 0
    let modeCount = 0

    pools.forEach(pool => {
      // 排除 solutions 和 nevermine 矿池
      if (pool.name.toLowerCase() !== 'solutions' && pool.name.toLowerCase() !== 'nevermine') {
        pool.miningModes.forEach(mode => {
          if (mode.weekProfit) {
            totalProfit += parseFloat(mode.weekProfit)
            modeCount++
          }
        })
      }
    })

    return modeCount > 0 ? totalProfit / modeCount : 0
  }

  // 获取下一个可用的纪元
  const findNextAvailableEpoch = (currentEpoch: number, direction: 'prev' | 'next'): number | null => {
    if (!epochsData.length) return null;
    
    const sortedEpochs = epochsData
      .map(data => data.epoch)
      .sort((a, b) => direction === 'prev' ? b - a : a - b);
    
    const targetEpoch = sortedEpochs.find(epoch => 
      direction === 'prev' ? epoch < currentEpoch : epoch > currentEpoch
    );
    
    return targetEpoch || null;
  };

  // 获取指定纪元范围的数据
  const getEpochRangeData = (epoch: number) => {
    if (!epoch || !earliestAvailableEpoch) return []
    
    const startEpoch = Math.max(earliestAvailableEpoch, epoch - 4)
    const rangeData = epochsData
      .filter(data => data.epoch >= startEpoch && data.epoch <= epoch)
      .sort((a, b) => a.epoch - b.epoch)

    if (rangeData.length > 0) {
      const baseProfit = rangeData[0].averageProfit
      return rangeData.map(data => ({
        ...data,
        profitPercentage: baseProfit > 0 ? ((data.averageProfit - baseProfit) / baseProfit) * 100 : 0
      }))
    }
    return []
  }

  // 获取趋势数据
  const getTrendData = (epoch: number) => {
    const rangeData = getEpochRangeData(epoch)
    if (rangeData.length >= 2) {
      const firstEpoch = rangeData[0]
      const lastEpoch = rangeData[rangeData.length - 1]
      return {
        trend: firstEpoch.averageProfit > 0 
          ? ((lastEpoch.averageProfit - firstEpoch.averageProfit) / firstEpoch.averageProfit) * 100 
          : 0,
        startEpoch: firstEpoch.epoch,
        endEpoch: lastEpoch.epoch
      }
    }
    return null
  }

  useEffect(() => {
    console.log('Current Epoch:', currentEpoch)
    console.log('Selected Epoch:', selectedEpoch)
    console.log('Mining Data:', miningData)
  }, [currentEpoch, selectedEpoch, miningData])

  useEffect(() => {
    const fetchAllEpochs = async () => {
      if (!currentEpoch) {
        console.log('Waiting for current epoch...')
        return
      }
      
      try {
        console.log('Fetching all epochs...')
        setIsLoading(true)
        setError(null)
        const year = new Date().getFullYear()
        const response = await fetch(`https://api.github.com/repos/XARKUR/calculator-history/contents/${year}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        const epochs = data
          .filter((file: any) => file.name.endsWith('.json'))
          .map((file: any) => parseInt(file.name.replace('.json', '')))
          .filter((epoch: number) => !isNaN(epoch))
        
        const uniqueEpochs = epochs
          .filter((value: number, index: number, self: number[]) => self.indexOf(value) === index)
          .sort((a: number, b: number) => a - b)
        
        console.log('Found epochs:', uniqueEpochs)
        
        if (uniqueEpochs.length > 0) {
          setEarliestAvailableEpoch(uniqueEpochs[0])
          setLatestAvailableEpoch(uniqueEpochs[uniqueEpochs.length - 1])
          // 只在初始化时设置 selectedEpoch
          if (!selectedEpoch) {
            setSelectedEpoch(uniqueEpochs[uniqueEpochs.length - 1])
          }
          
          const epochDetails: EpochData[] = []
          for (const epoch of uniqueEpochs) {
            try {
              console.log(`Fetching data for epoch ${epoch}...`)
              const response = await fetch(`https://raw.githubusercontent.com/XARKUR/calculator-history/main/${year}/${epoch}.json`)
              if (!response.ok) {
                console.error(`Failed to fetch data for epoch ${epoch}`)
                continue
              }
              const jsonText = await response.text()
              const fixedJsonText = fixJsonString(jsonText)
              const epochData = JSON.parse(fixedJsonText) as ApiResponse
              
              const averageProfit = calculateEpochProfit(epochData.pools)
              
              epochDetails.push({
                epoch,
                averageProfit,
                price: epochData.price,
                startTime: epochData.startTime,
                endTime: epochData.endTime,
                averageScore: epochData.averageScore,
                totalSolutions: epochData.totalSolutions
              })
            } catch (error) {
              console.error(`Error fetching data for epoch ${epoch}:`, error)
            }
          }
          console.log('Setting epochs data:', epochDetails)
          setEpochsData(epochDetails)
        }
      } catch (error) {
        console.error('Error fetching epochs:', error)
        setError('Failed to load epoch data')
      } finally {
        setIsInitialLoad(false)
        setIsLoading(false)
      }
    }

    fetchAllEpochs()
  }, [currentEpoch, selectedEpoch])

  useEffect(() => {
    const fetchEpochData = async () => {
      if (!selectedEpoch) {
        console.log('No epoch selected yet')
        return
      }

      try {
        console.log(`Fetching mining data for epoch ${selectedEpoch}...`)
        const year = new Date().getFullYear()
        const response = await fetch(`https://raw.githubusercontent.com/XARKUR/calculator-history/main/${year}/${selectedEpoch}.json`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const jsonText = await response.text()
        const fixedJsonText = fixJsonString(jsonText)
        const data = JSON.parse(fixedJsonText) as ApiResponse
        console.log('Setting mining data:', data)
        setMiningData(data)
      } catch (error) {
        console.error('Error fetching epoch data:', error)
        // 如果当前纪元数据不可用，尝试获取上一个纪元的数据
        if (selectedEpoch && latestAvailableEpoch && selectedEpoch < latestAvailableEpoch) {
          console.log(`Trying next epoch ${selectedEpoch + 1}...`)
          setSelectedEpoch(selectedEpoch + 1)
        } else if (selectedEpoch && earliestAvailableEpoch && selectedEpoch > earliestAvailableEpoch) {
          console.log(`Trying previous epoch ${selectedEpoch - 1}...`)
          setSelectedEpoch(selectedEpoch - 1)
        } else {
          setError('No available epoch data')
        }
      }
    }

    fetchEpochData()
  }, [selectedEpoch])

  if (isLoading && isInitialLoad) {
    return <ContentGridSkeleton />
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="grid gap-4 md:gap-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            <div className="md:col-span-3">
              <div className="text-lg text-red-500">{error}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-full overflow-x-hidden">
      <div className="grid grid-cols-12 gap-4">
        {/* 左侧：纪元选择和搜索 */}
        <div className="col-span-12 md:col-span-3">
          <Card className={cn(CARD_HEIGHT, "flex flex-col")}>
            <CardHeader className="pb-2 flex-none">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xl font-semibold leading-none tracking-tight">{t("calculator.history.epochNavigation")}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-4 pt-2">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    type="number"
                    placeholder={`${earliestAvailableEpoch !== null ? earliestAvailableEpoch : 0} - ${latestAvailableEpoch !== null ? latestAvailableEpoch : 0}`}
                    className="pl-9 placeholder:text-muted-foreground/50"
                    value={searchEpoch}
                    onChange={(e) => {
                      const value = e.target.value
                      setSearchEpoch(value)
                      const epoch = parseInt(value)
                      if (!isNaN(epoch) && epoch >= (earliestAvailableEpoch !== null ? earliestAvailableEpoch : 0) && epoch <= (latestAvailableEpoch !== null ? latestAvailableEpoch : 0)) {
                        setSelectedEpoch(epoch)
                      }
                    }}
                    min={earliestAvailableEpoch !== null ? earliestAvailableEpoch : 0}
                    max={latestAvailableEpoch !== null ? latestAvailableEpoch : 0}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (selectedEpoch) {
                        const prevEpoch = findNextAvailableEpoch(selectedEpoch, 'prev');
                        if (prevEpoch !== null) {
                          setSelectedEpoch(prevEpoch);
                        }
                      }
                    }}
                    disabled={!selectedEpoch || !findNextAvailableEpoch(selectedEpoch || 0, 'prev')}
                    className="flex-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (selectedEpoch) {
                        const nextEpoch = findNextAvailableEpoch(selectedEpoch, 'next');
                        if (nextEpoch !== null) {
                          setSelectedEpoch(nextEpoch);
                        }
                      }
                    }}
                    disabled={!selectedEpoch || !findNextAvailableEpoch(selectedEpoch || 0, 'next')}
                    className="flex-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => latestAvailableEpoch !== null && setSelectedEpoch(latestAvailableEpoch)}
                    disabled={selectedEpoch === latestAvailableEpoch}
                    className="flex-1 whitespace-nowrap"
                  >
                    {t("calculator.history.latest")}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border px-4 py-3">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">{t("calculator.history.status")}</span>{" "}
                    </div>
                    <Badge variant={selectedEpoch === latestAvailableEpoch ? "default" : "secondary"}>
                      {t("calculator.history.epoch")} {selectedEpoch}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">{t("calculator.history.current")}</span>{" "}
                    </div>
                    <div className="text-sm">
                      <Badge variant={"secondary"}>{t("calculator.history.epoch")} {currentEpoch}</Badge>{" "}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border px-4 py-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("calculator.history.startTime")}</span>
                    <span className="font-medium">
                      {epochsData.find(e => e.epoch === selectedEpoch)?.startTime || (selectedEpoch !== null ? calculateEpochTimes(selectedEpoch).startTime : '')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("calculator.history.endTime")}</span>
                    <span className="font-medium">
                      {epochsData.find(e => e.epoch === selectedEpoch)?.endTime || (selectedEpoch !== null ? calculateEpochTimes(selectedEpoch).endTime : '')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("calculator.history.totalSolutions")}</span>
                    <span className="font-medium">{miningData?.totalSolutions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("calculator.history.averageScore")}</span>
                    <span className="font-medium">{miningData?.averageScore || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("calculator.history.totalHistory")}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{t("calculator.history.epoch")} {epochsData[0]?.epoch || earliestAvailableEpoch} - {latestAvailableEpoch}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：矿池信息表格 */}
        <div className="col-span-12 md:col-span-9">
          <Card className={cn(CARD_HEIGHT, "flex flex-col")}>
            <CardHeader className="pb-2 flex-none">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold leading-none tracking-tight">
                    {t("calculator.history.poolInformation")}
                  </CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    if (!miningData?.pools) return;

                    // 准备 CSV 数据
                    const csvContent = [
                      // CSV 头部
                      [
                        t('calculator.history.poolName'),
                        t('calculator.history.miningMode'),
                        t('calculator.history.sharesPerSolution'),
                        t('calculator.history.estimateCoins'),
                        t('calculator.history.actualCoins'),
                        t('calculator.history.accuracy')
                      ].join(','),
                      // CSV 数据行
                      ...miningData.pools.flatMap(pool =>
                        pool.miningModes.map(mode => {
                          const estimate = mode.coinsPerSolution[0].estimate;
                          const actual = mode.coinsPerSolution[0].actual;
                          const accuracy = actual !== null
                            ? ((1 - Math.abs(estimate - actual) / actual) * 100).toFixed(2)
                            : '';
                          return [
                            pool.name,
                            mode.type.toUpperCase(),
                            mode.sharesPerSolution?.toLocaleString() || '',
                            estimate.toLocaleString(),
                            actual !== null ? actual.toLocaleString() : '',
                            accuracy ? `${accuracy}%` : ''
                          ].join(',');
                        })
                      )
                    ].join('\n');

                    // 创建 Blob 对象
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    
                    // 创建下载链接
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    
                    // 设置下载属性
                    link.setAttribute('href', url);
                    link.setAttribute('download', `${t('calculator.history.button.profit')}-${selectedEpoch}.csv`);
                    
                    // 添加到文档并触发下载
                    document.body.appendChild(link);
                    link.click();
                    
                    // 清理
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  disabled={!miningData?.pools}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  {t('calculator.history.button.export')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-auto pt-2">
              <div className="rounded-lg border rounded-lg overflow-hidden">
                <Card className="border-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="tracking-tight text-base font-semibold">
                          {t("calculator.history.profitTrend")}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {t("calculator.history.epochRange", { 
                            start: selectedEpoch != null ? (getEpochRangeData(selectedEpoch)?.[0]?.epoch ?? selectedEpoch) : 0, 
                            end: selectedEpoch ?? 0 
                          })}
                        </CardDescription>
                      </div>
                      {selectedEpoch !== null && getTrendData(selectedEpoch) && (
                        <div className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5",
                          getTrendData(selectedEpoch)!.trend > 0 
                            ? "bg-green-500/10 text-green-500" 
                            : "bg-red-500/10 text-red-500"
                        )}>
                          {getTrendData(selectedEpoch)!.trend > 0 ? (
                            <>
                              <TrendingUp className="h-3.5 w-3.5" />
                              <span>+{getTrendData(selectedEpoch)!.trend.toFixed(2)}%</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3.5 w-3.5" />
                              <span>{getTrendData(selectedEpoch)!.trend.toFixed(2)}%</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-[200px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={selectedEpoch ? getEpochRangeData(selectedEpoch) : []}
                          margin={{
                            left: 15,
                            right: 15,
                            top: 8,
                            bottom: 8,
                          }}
                        >
                          <defs>
                            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
                            </linearGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            vertical={false}
                            stroke="hsl(var(--muted-foreground))"
                            opacity={0.08}
                          />
                          <XAxis
                            dataKey="epoch"
                            tickLine={false}
                            axisLine={false}
                            tick={{ 
                              fill: 'hsl(var(--muted-foreground))', 
                              fontSize: 11
                            }}
                            dy={8}
                            tickFormatter={(value) => `${t("calculator.history.epoch")} ${value}`}
                            interval={0}
                            minTickGap={10}
                            padding={{ left: 30, right: 30 }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            tickFormatter={(value) => `${value > 0 ? '+' : ''}${Math.round(value)}%`}
                            dx={-8}
                            width={40}
                            domain={['dataMin', 'dataMax']}
                            allowDataOverflow={false}
                            padding={{ top: 20, bottom: 20 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="profitPercentage"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{
                              r: 4,
                              fill: "hsl(var(--background))",
                              stroke: "hsl(var(--primary))",
                              strokeWidth: 2,
                              filter: "url(#glow)"
                            }}
                            fill="url(#profitGradient)"
                            connectNulls={true}
                            isAnimationActive={false}
                          />
                          <Tooltip
                            cursor={{
                              stroke: "hsl(var(--muted-foreground))",
                              strokeWidth: 1,
                              strokeDasharray: "3 3",
                              opacity: 0.4
                            }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const data = payload[0].payload
                              const value = Number(data.profitPercentage)
                              return (
                                <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
                                  <div className="grid gap-2">
                                    <div className="flex items-center justify-between gap-8">
                                      <span className="text-xs font-medium text-muted-foreground">
                                      {t("calculator.history.epoch")} {data.epoch}
                                      </span>
                                      <div className={cn(
                                        "px-1.5 py-0.5 rounded text-xs font-medium",
                                        value > 0 
                                          ? "bg-green-500/10 text-green-500" 
                                          : "bg-red-500/10 text-red-500"
                                      )}>
                                        {value > 0 ? "+" : ""}{value.toFixed(2)}%
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                      <span className="text-sm font-medium text-popover-foreground">
                                        {value > 0 ? "+" : ""}{value.toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4">
                    <p className="text-xs text-muted-foreground">
                      {t("calculator.history.profitTrendDescription")}
                    </p>
                  </CardFooter>
                </Card>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="w-[16.67%]">{t("calculator.history.poolName")}</TableHead>
                      <TableHead className="w-[16.67%]">{t("calculator.history.miningMode")}</TableHead>
                      <TableHead className="w-[16.67%] text-center">{t("calculator.history.sharesPerSolution")}</TableHead>
                      <TableHead className="w-[16.67%] text-center">{t("calculator.history.estimateCoins")}</TableHead>
                      <TableHead className="w-[16.67%] text-center">{t("calculator.history.actualCoins")}</TableHead>
                      <TableHead className="w-[16.67%] text-center">{t("calculator.history.accuracy")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr:last-child]:border-0">
                    {miningData?.pools.map((pool: Pool) => (
                      <React.Fragment key={pool.name}>
                        {pool.miningModes.map((mode: MiningMode, modeIndex: number) => {
                          const estimate = mode.coinsPerSolution[0].estimate;
                          const actual = mode.coinsPerSolution[0].actual;
                          const accuracy = actual !== null 
                            ? ((1 - Math.abs(estimate - actual) / actual) * 100).toFixed(2)
                            : null;
                          const isAccurate = accuracy !== null && Number(accuracy) >= 95;
                          const isLastModeInPool = modeIndex === pool.miningModes.length - 1;
                          const isFirstModeInPool = modeIndex === 0;

                          return (
                            <TableRow 
                              key={`${pool.name}-${mode.type}`}
                              className={`
                                ${!isLastModeInPool ? "border-0" : ""}
                                ${isFirstModeInPool ? "border-t" : ""}
                                ${!isLastModeInPool ? "[&_td]:pb-2" : ""}
                                ${!isFirstModeInPool ? "[&_td]:pt-2" : ""}
                              `}
                            >
                              <TableCell className="w-[16.67%] font-medium">
                                {isFirstModeInPool ? pool.name : ""}
                              </TableCell>
                              <TableCell className="w-[16.67%]">
                                <Badge variant={mode.type === "solo" ? "default" : "secondary"}>
                                  {mode.type.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-[16.67%] text-center">
                                {mode.sharesPerSolution 
                                  ? mode.sharesPerSolution.toLocaleString()
                                  : "-"}
                              </TableCell>
                              <TableCell className="w-[16.67%] text-center">
                                {estimate.toLocaleString()}
                              </TableCell>
                              <TableCell className="w-[16.67%] text-center">
                                {actual !== null ? actual.toLocaleString() : "-"}
                              </TableCell>
                              <TableCell className="w-[16.67%] text-center">
                                <span className={isAccurate ? "text-green-500" : "text-red-500"}>
                                  {accuracy !== null ? `${accuracy}%` : "-"}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
