"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { PoolStatsCard } from "@/components/features/calculator/pool-stats-card"
import { ProfitCalculator } from "@/components/features/calculator/profit-calculator"
import { PoolList } from "@/components/features/calculator/pool-list"
import { Activity, Users, Plus, HelpCircle, CalendarSearch } from "lucide-react"
import { ContentSkeleton } from "@/components/features/shared/content-skeleton"
import React from "react"
import { useQubicData } from "@/providers/qubic-data-provider"
import { useTranslation } from 'react-i18next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const CARD_HEIGHT = "h-[41rem]"
const SCROLL_HEIGHT = "h-[36rem]"

export function ContentGrid() {
  const { data: qubicData, isLoading } = useQubicData()
  const { t } = useTranslation()

  if (isLoading) {
    return <ContentSkeleton />;
  }

  if (!qubicData) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div data-testid="content-grid" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
        <ErrorBoundary>
          <Card data-testid="pool-stats-section" className={`col-span-1 ${CARD_HEIGHT} flex flex-col`}>
            <CardHeader className="border-b py-3 sm:py-4 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t('calculator.poolStats.title')}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 flex items-center gap-2" 
                  asChild
                >
                  <a
                    href="/calculator/history"
                    target="_self"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <CalendarSearch className="h-4 w-4" />
                    <span className="text-sm">{t('calculator.history.title')}</span>
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 pt-0 overflow-hidden">
              <ScrollArea className={SCROLL_HEIGHT}>
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                  <PoolStatsCard 
                    apool={qubicData?.apoolStats}
                    minerlab={qubicData?.minerlabStats}
                    nevermine={qubicData?.nevermineStats}
                    solutions={qubicData?.solutionsStats}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary>
          <div data-testid="calculator-section" className={`col-span-1 ${CARD_HEIGHT}`}>
            <ProfitCalculator />
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <Card data-testid="pool-section" className={`col-span-1 ${CARD_HEIGHT} flex flex-col`}>
            <CardHeader className="border-b py-3 sm:py-4 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('calculator.pool.title')}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">
                          {t('calculator.pool.pattern.title.tooltip')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 flex items-center gap-2" 
                  asChild
                >
                  <a
                    href="https://github.com/XARKUR/QubicTools/blob/main/docs/add-mining-pool.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">{t('calculator.pool.add')}</span>
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 pt-0 overflow-hidden">
              <ScrollArea className={SCROLL_HEIGHT}>
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                  <PoolList />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    </div>
  )
}

ContentGrid.displayName = "ContentGrid"
