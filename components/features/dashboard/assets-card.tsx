"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Coins, HelpCircle, ArrowLeftRight } from "lucide-react"
import { useTranslation } from 'react-i18next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const CARD_HEIGHT = "min-h-[calc(100vh-17rem)] lg:h-[calc(100vh-17rem)]"
const SCROLL_HEIGHT = "min-h-[calc(100vh-21rem)] lg:h-[calc(100vh-21rem)]"

interface AssetsCardProps {
  assets: {
    smart_contract: Record<string, { issuer: string; price: number }>;
    tokens: Record<string, { issuer: string; price: number }>;
  };
}

export function AssetsCard({ assets }: AssetsCardProps) {
  const { t } = useTranslation()

  const getAssetUrl = (issuer: string, name: string) => {
    return `https://qx.qubic.org/qx-assets/${issuer}/${name}`
  }

  const renderAssetRow = (name: string, { issuer, price }: { issuer: string; price: number }) => (
    <div key={name} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
      <a
        href={getAssetUrl(issuer, name)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium hover:underline"
      >
        {name}
      </a>
      <span className="text-sm tabular-nums">{price.toLocaleString()}</span>
    </div>
  )

  return (
    <Card data-testid="assets-section" className={`col-span-1 ${CARD_HEIGHT} flex flex-col`}>
      <CardHeader className="border-b py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Coins className="h-4 w-4" />
            {t('dashboard.assets.title')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">{t('dashboard.assets.tooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8"
          >
            <a
              href="https://qx.qubic.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span className="text-sm">{t('dashboard.assets.qx')}</span>
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className={SCROLL_HEIGHT}>
          <div className="p-4 space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-medium">{t('dashboard.assets.smartContract')}</h3>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
                <div className="rounded-lg border bg-card">
                  <div className="flex items-center justify-between p-3 border-b bg-muted/40">
                    <span className="text-sm font-medium">{t('dashboard.assets.name')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t('dashboard.assets.price.title')} (QUs)</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] text-xs">{t('dashboard.assets.price.tooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="divide-y divide-border/60">
                    {Object.entries(assets.smart_contract)
                      .sort(([, a], [, b]) => b.price - a.price)
                      .map(([name, asset]) => renderAssetRow(name, asset))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-medium">{t('dashboard.assets.tokens')}</h3>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
                <div className="rounded-lg border bg-card">
                  <div className="flex items-center justify-between p-3 border-b bg-muted/40">
                    <span className="text-sm font-medium">{t('dashboard.assets.name')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t('dashboard.assets.price.title')} (QUs)</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] text-xs">{t('dashboard.assets.price.tooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="divide-y divide-border/60">
                    {Object.entries(assets.tokens)
                      .sort(([, a], [, b]) => b.price - a.price)
                      .map(([name, asset]) => renderAssetRow(name, asset))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

AssetsCard.displayName = "AssetsCard"