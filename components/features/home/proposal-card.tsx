"use client"

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, ExternalLink, FileQuestion } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from 'react-i18next'

/**
 * 
 * @interface ProposalCardProps
 * @property {string} title 
 * @property {string} date 
 * @property {string} link 
 * @property {Array<{label: string, votes: number, percentage: number}>} options 
 * @property {number} totalVotes 
 * @property {string} [className] 
 */
interface ProposalCardProps {
  title?: string;
  date?: string;
  link?: string;
  options?: Array<{
    label: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes?: number;
  className?: string;
}

/**
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
 * <ProposalCard
 *   title="title"
 *   date="2024-01-01"
 *   link="https://example.com"
 *   options={[
 *     { label: "options1", votes: 100, percentage: 66.67 },
 *     { label: "options2", votes: 50, percentage: 33.33 }
 *   ]}
 *   totalVotes={150}
 * />
 * ```
 */
const ProposalCard = memo<ProposalCardProps>(({
  title,
  date,
  link,
  options = [],
  totalVotes = 0,
  className
}) => {
  const { t } = useTranslation()
  const hasProposal = title && date && link;

  return (
    <Card data-testid="proposal-card" className={cn(
      "w-full border-border/50 hover:border-border/80 transition-colors",
      className
    )}>
      <CardContent className="p-4 space-y-4">
        {hasProposal ? (
          <>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 data-testid="proposal-title" className="text-base font-semibold leading-none tracking-tight">
                  {title}
                </h3>
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <CalendarDays className="h-3 w-3" />
                  {date}
                </Badge>
              </div>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary"
                >
                  {t('home.proposals.viewDetails')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>

            {totalVotes > 0 ? (
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{option.label}</span>
                      <span>{option.votes} {t('home.proposals.votes')} ({option.percentage}%)</span>
                    </div>
                    <Progress value={option.percentage} />
                  </div>
                ))}
                <div className="text-xs text-muted-foreground">
                  {t('home.proposals.totalVotes')}: {totalVotes}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{t('home.proposals.noVotes')}</div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-base">{t('home.proposals.noProposal.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('home.proposals.noProposal.description')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

ProposalCard.displayName = "ProposalCard"

export { ProposalCard }
