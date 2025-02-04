"use client"

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useTranslation } from 'react-i18next'
// import { ExternalLink, BookOpen, MessageSquare } from "lucide-react"
import { SystemBadge, SystemType } from "./pool-list"

interface PoolCardProps {
  name: string
  fee: string
  website?: string
  tutorial?: string
  community?: string
  description?: string
  features?: string[]
  systems?: SystemType[]
  className?: string
}

const PoolCard = memo<PoolCardProps>(({
  name,
  fee,
  website,
  tutorial,
  community,
  description,
  features,
  systems,
  className
}) => {
  const { t } = useTranslation()

  return (
    <Card data-testid="pool-card" className={cn(
      "w-full border-border/50 hover:border-border/80 transition-colors",
      className
    )}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 data-testid="pool-name" className="text-base font-semibold leading-none tracking-tight">
                {name}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {t('calculator.pool.fee')}: {fee}
              </Badge>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground py-1">
                {description}
              </p>
            )}
            {features && features.length > 0 && (
              <ul className="list-disc list-inside text-sm text-muted-foreground py-1 space-y-1">
                {features.map((feature, index) => (
                  <li key={index}>{t(feature)}</li>
                ))}
              </ul>
            )}
            {systems && systems.length > 0 && (
              <div className="mt-2">
                {systems.map((system) => (
                  <SystemBadge key={system} type={system} />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {website && (
              <Button variant="link" size="sm" className="h-auto p-0 mt-2" asChild>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  {t('calculator.pool.website')}
                </a>
              </Button>
            )}
            {tutorial && (
              <Button variant="link" size="sm" className="h-auto p-0 mt-2" asChild>
                <a
                  href={tutorial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  {t('calculator.pool.tutorial')}
                </a>
              </Button>
            )}
            {community && (
              <Button variant="link" size="sm" className="h-auto p-0 mt-2" asChild>
                <a
                  href={community}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  {t('calculator.pool.community')}
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

PoolCard.displayName = "PoolCard"

export { PoolCard }
