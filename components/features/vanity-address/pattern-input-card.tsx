"use client"

import { memo } from "react"
import { Dices, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { NetworkStatusAlert } from "@/components/shared/network-status-alert"
import { cn } from "@/lib/utils"
import { useTranslation } from 'react-i18next'
import { ClientOnly } from '@/components/i18n/client-only'

/**
 * 
 * @interface PatternInputCardProps
 * @property {string} pattern 
 * @property {function} setPattern 
 * @property {'prefix' | 'suffix'} patternType 
 * @property {function} setPatternType 
 * @property {number} cpuUsage 
 * @property {function} setCpuUsage 
 * @property {boolean} forceStart 
 * @property {function} setForceStart 
 * @property {function} onGenerate 
 * @property {function} onResume 
 * @property {function} onPause 
 * @property {boolean} isPaused 
 */
interface PatternInputCardProps {
  pattern: string
  setPattern: (pattern: string) => void
  patternType: 'prefix' | 'suffix'
  setPatternType: (type: 'prefix' | 'suffix') => void
  cpuUsage: number
  setCpuUsage: (usage: number) => void
  forceStart: boolean
  setForceStart: (force: boolean) => void
  onGenerate: () => void
  onResume: () => void
  onPause: () => void
  isPaused: boolean
}

export const PatternInputCard = memo<PatternInputCardProps>(({
  pattern,
  setPattern,
  patternType,
  setPatternType,
  cpuUsage,
  setCpuUsage,
  forceStart,
  setForceStart,
  onGenerate,
  onResume,
  onPause,
  isPaused,
}) => {
  const { isOffline } = useNetworkStatus()
  const { t } = useTranslation()

  return (
    <ClientOnly>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Dices className="h-5 w-5" />
              <div className="font-semibold leading-none tracking-tight">
                {t('vanityAddress.title')}
              </div>
            </div>
            <NetworkStatusAlert />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              {t('vanityAddress.pattern.offlineNotice')}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={forceStart}
                onCheckedChange={setForceStart}
                className="h-4 w-7 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
              />
              <span className="text-xs whitespace-nowrap">{t('vanityAddress.pattern.forceStart.label')}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-xs">
                      {t('vanityAddress.pattern.forceStart.tooltip')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="space-y-2">
            <Label>
              {t('vanityAddress.pattern.input.label')}
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={t('vanityAddress.pattern.input.placeholder')}
                  value={pattern}
                  onChange={(e) => {
                    const newValue = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                    requestAnimationFrame(() => {
                      setPattern(newValue);
                    });
                  }}
                  onKeyUp={(e) => {
                    const target = e.target as HTMLInputElement;
                    const newValue = target.value.toUpperCase().replace(/[^A-Z]/g, '');
                    if (target.value !== newValue) {
                      target.value = newValue;
                    }
                  }}
                  className="font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 sm:flex-none",
                    patternType === "prefix" 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-primary/10"
                  )}
                  onClick={() => setPatternType("prefix")}
                >
                  {t('vanityAddress.pattern.type.prefix')}
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 sm:flex-none",
                    patternType === "suffix" 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-primary/10"
                  )}
                  onClick={() => setPatternType("suffix")}
                >
                  {t('vanityAddress.pattern.type.suffix')}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground break-all">
              <span className="text-xs">{t('vanityAddress.pattern.example')}: </span>
              <span className="font-mono">
                {patternType === 'prefix' 
                  ? 'QUBICABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABC'
                  : 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCQUBIC'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <Label>{t('vanityAddress.pattern.cpuUsage.label')}</Label>
                <span className="text-sm text-muted-foreground">{cpuUsage}%</span>
              </div>
              <div className="w-full">
                <Slider
                  value={[cpuUsage]}
                  onValueChange={(value) => setCpuUsage(value[0])}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-green-500 hover:bg-green-600" 
              disabled={!pattern || (!isOffline && !forceStart)}
              onClick={onGenerate}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <polygon points="6 3 20 12 6 21 6 3"></polygon>
              </svg>
              {t('vanityAddress.button.start')}
            </Button>
            <Button 
              variant="secondary"
              className="flex-1" 
              disabled={!pattern || (!isOffline && !forceStart)}
              onClick={isPaused ? onResume : onPause}
            >
              {isPaused ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <polygon points="6 3 20 12 6 21 6 3"></polygon>
                  </svg>
                  {t('vanityAddress.button.resume')}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                    <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                  </svg>
                  {t('vanityAddress.button.pause')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </ClientOnly>
  )
})

PatternInputCard.displayName = "PatternInputCard"
