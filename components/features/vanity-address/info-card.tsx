"use client"

import { memo, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { ClientOnly } from '@/components/i18n/client-only'

interface InfoCardProps {
  difficulty: number
  generatedCount: number
  speed: number
  status: string
  duration?: number
  isPaused?: boolean
}

export const InfoCard = memo<InfoCardProps>(({
  difficulty,
  generatedCount,
  speed,
  status,
  duration = 0,
  isPaused = false
}) => {
  const { t } = useTranslation()

  const difficultyDisplay = difficulty > 0 ? t('vanityAddress.info.difficultyValue', { value: difficulty.toLocaleString() }) : '-';

  const avgSpeed = useMemo(() => {
    if (isPaused) return 0;
    if (!duration || duration < 1000) return speed;
    return Math.round(generatedCount / (duration / 1000));
  }, [generatedCount, duration, speed, isPaused]);

  const actualProgress = useMemo(() => {
    if (difficulty === 0) return 0;
    return Math.min(100, Math.round((generatedCount / difficulty) * 100));
  }, [generatedCount, difficulty]);

  return (
    <ClientOnly>
      <Card>
        <CardHeader className="p-6">
          <div className="font-semibold leading-none tracking-tight">
            {t('vanityAddress.info.title')}
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <div className="grid gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('vanityAddress.info.difficulty')}</span>
              <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                {difficultyDisplay}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('vanityAddress.info.attempts')}</span>
              <span>{generatedCount.toLocaleString()} addresses</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('vanityAddress.info.speed')}</span>
              <span>{avgSpeed.toLocaleString()} addr/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('vanityAddress.info.status')}</span>
              <span>{status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('vanityAddress.info.progress')}</span>
              <span>{actualProgress}%</span>
            </div>
          </div>

          <Progress value={actualProgress} className="h-2" />

          <Alert className="flex items-center justify-center p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <h5 className="font-medium leading-none tracking-tight mb-0 text-xs">
                {t('vanityAddress.info.recommendedLength')}
              </h5>
            </div>
          </Alert>
        </CardContent>
      </Card>
    </ClientOnly>
  )
})

InfoCard.displayName = "InfoCard"
