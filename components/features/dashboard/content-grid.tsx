"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ProposalCard } from "@/components/features/dashboard/proposal-card"
import { ArticleList } from "@/components/features/dashboard/article-list"
import { AssetsCard } from "@/components/features/dashboard/assets-card"
import { FileText, Newspaper, Plus, CalendarCheck2 } from "lucide-react"
import React from "react"
import { useQubicData } from "@/providers/qubic-data-provider"
import { useTranslation } from 'react-i18next'
import { ContentSkeleton } from "@/components/features/shared/content-skeleton"

/**
 * 
 * 
 * @constant
 */
const CARD_HEIGHT = "h-[40rem]"

/**
 * 
 * 
 * @constant
 */
const SCROLL_HEIGHT = "h-[36rem]"

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

/*
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
export function ContentGrid() {
  const { t } = useTranslation()
  const { data: qubicData, isLoading } = useQubicData()

  if (isLoading) {
    return <ContentSkeleton />;
  }

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
    <div data-testid="content-grid" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
      <ErrorBoundary>
        <Card data-testid="proposal-section" className={`col-span-1 ${CARD_HEIGHT} flex flex-col`}>
          <CardHeader className="border-b py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('dashboard.proposals.title')}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8"
              >
                <a
                  href="https://proposals.qubic.org/?status=ended_proposals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <CalendarCheck2 className="h-4 w-4" />
                  <span className="text-sm">{t('dashboard.proposals.history')}</span>
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 pt-0 overflow-hidden">
            <ScrollArea className={SCROLL_HEIGHT}>
              <div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                {qubicData?.proposal ? (
                  <ProposalCard {...processProposalOptions(qubicData.proposal)} />
                ) : (
                  <div className="text-center text-muted-foreground">
                    {t('dashboard.proposals.empty')}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </ErrorBoundary>

      <ErrorBoundary>
        {qubicData?.assets && <AssetsCard assets={qubicData.assets} />}
      </ErrorBoundary>

      <ErrorBoundary>
        <Card data-testid="article-section" className={`col-span-1 ${CARD_HEIGHT} flex flex-col`}>
          <CardHeader className="border-b py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                {t('dashboard.articles.title')}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8"
              >
                <a
                  href="https://qubic.org/blog-grid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">{t('dashboard.articles.viewAll')}</span>
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 pt-0 overflow-hidden">
            <ScrollArea className={SCROLL_HEIGHT}>
              <ArticleList />
            </ScrollArea>
          </CardContent>
        </Card>
      </ErrorBoundary>
    </div>
  )
}

ContentGrid.displayName = "ContentGrid"
