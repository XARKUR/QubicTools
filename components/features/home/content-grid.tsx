"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ProposalCard } from "@/components/features/home/proposal-card"
import { ProfitCalculator } from "@/components/features/home/profit-calculator"
import { PoolList } from "@/components/features/home/pool-list"
import { FileText, Users, Plus, HelpCircle } from "lucide-react"
import React from "react"
import { useQubicData } from "@/providers/qubic-data-provider"
import { useTranslation } from 'react-i18next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * 
 * 
 * @constant
 */
const CARD_HEIGHT = "min-h-[calc(100vh-17rem)] lg:h-[calc(100vh-17rem)]"

/**
 * 
 * 
 * @constant
 */
const SCROLL_HEIGHT = "min-h-[calc(100vh-21rem)] lg:h-[calc(100vh-21rem)]"

interface ProposalData {
  epoch: number;
  hasVotes: boolean;
  options: Array<{
    index: number;
    label: string;
    value?: string;
    votes: number;
  }>;
  proposalType: string;
  published: string;
  status: number;
  title: string;
  totalVotes: number;
  url: string;
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
 * @component
 * @example
 * ```tsx
 * 
 * import { ContentGrid } from '@/components/features/home/content-grid';
 * 
 * export default function HomePage() {
 *   return (
 *     <div className="container">
 *       <ContentGrid />
 *     </div>
 *   );
 * }
 * ```
 */
export const ContentGrid = React.memo(function ContentGrid() {
  const { t } = useTranslation()
  const { data: qubicData } = useQubicData();

  const processProposalOptions = (proposal: ProposalData) => {
    const options = proposal.options.map(option => ({
      label: option.label,
      votes: option.votes,
      percentage: proposal.totalVotes > 0 
        ? Math.round((option.votes / proposal.totalVotes) * 100)
        : 0
    }));

    return {
      title: proposal.title,
      date: proposal.published.split('T')[0],
      link: proposal.url,
      options: options,
      totalVotes: proposal.totalVotes
    };
  };

  return (
    <div data-testid="content-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ErrorBoundary>
        <Card data-testid="proposal-section" className={`col-span-1 ${CARD_HEIGHT} flex flex-col`}>
          <CardHeader className="border-b py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('home.proposals.title')}
              </CardTitle>
              <div className="opacity-0">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 pt-0 overflow-hidden">
            <ScrollArea className={SCROLL_HEIGHT}>
              <div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                {qubicData?.proposal ? (
                  <ProposalCard {...processProposalOptions(qubicData.proposal)} />
                ) : (
                  <div className="text-center text-muted-foreground">
                    {t('home.proposals.empty')}
                  </div>
                )}
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
          <CardHeader className="border-b py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('home.pool.title')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">
                        {t('home.pool.pattern.title.tooltip')}
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
                  href="https://github.com/XARKUR/QubicTools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">{t('home.pool.add')}</span>
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 pt-0 overflow-hidden">
            <ScrollArea className={SCROLL_HEIGHT}>
              <div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <PoolList />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </ErrorBoundary>
    </div>
  )
})

ContentGrid.displayName = "ContentGrid"
