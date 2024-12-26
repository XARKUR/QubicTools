"use client"

import { memo } from "react"
import { HelpCircle, Group, } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from 'react-i18next'

interface WalletSettingsProps {
  forceStart: boolean
  walletCount: string
  onForceStartChange: (value: boolean) => void
  onWalletCountChange: (value: string) => void
  onGenerate: () => void
}

export const WalletSettings = memo(function WalletSettings({
  forceStart,
  walletCount,
  onForceStartChange,
  onWalletCountChange,
  onGenerate
}: WalletSettingsProps) {
  const { t } = useTranslation()

  return (
    <Card className="h-[400px]">
      <CardHeader className="p-6">
        <div className="flex flex-col space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Group className="h-5 w-5" />
              <div className="font-semibold leading-none tracking-tight">
                {t('batchWallet.settings.title')}
              </div>
            </div>
            <Alert variant="destructive" className="ml-0 sm:ml-4 py-1.5 px-3 h-8 w-fit max-w-full sm:max-w-[280px] flex items-center">
              <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
              <AlertDescription className="text-xs ml-2 whitespace-nowrap">
                {t('batchWallet.settings.networkAlert')}
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {t('batchWallet.settings.offlineNotice')}
            </div>
            <div className="flex items-center gap-2 ml-0 sm:ml-4">
              <Switch
                checked={forceStart}
                onCheckedChange={onForceStartChange}
                className="h-4 w-7 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
              />
              <span className="text-xs">{t('batchWallet.settings.forceStart.label')}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-xs">
                      {t('batchWallet.settings.forceStart.tooltip')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardHeader>
      <div className="p-6 pt-0 space-y-6">
        <div className="space-y-2">
          <div className="text-sm font-medium">{t('batchWallet.settings.count.label')}</div>
          <Input
            type="number"
            min="1"
            max="100"
            value={walletCount}
            onChange={(e) => onWalletCountChange(e.target.value)}
            placeholder={t('batchWallet.settings.count.placeholder')}
          />
        </div>

        <Button 
          className="w-full bg-green-500 hover:bg-green-600" 
          disabled={!walletCount}
          onClick={onGenerate}
        >
          {t('batchWallet.settings.start')}
        </Button>
      </div>
    </Card>
  )
})
