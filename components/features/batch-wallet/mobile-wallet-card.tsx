"use client"

import { memo } from "react"
import { QrCode, Download } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from 'react-i18next'
import { type Wallet } from "@/types/wallet"

interface MobileWalletCardProps {
  wallets: Wallet[]
  isGenerating: boolean
}

export const MobileWalletCard = memo(function MobileWalletCard({
  wallets = [],
  isGenerating = false
}: MobileWalletCardProps) {
  const { t } = useTranslation()

  const handleExport = () => {
    const csv = [
      [
        t('batchWallet.export.headers.index'),
        t('batchWallet.export.headers.address'),
        t('batchWallet.export.headers.privateKey')
      ].join(','),
      ...wallets.map((wallet, index) =>
        [index + 1, wallet.publicId, wallet.privateKey].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wallets.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <h3 className="font-semibold">
                {t('batchWallet.results.title')}
              </h3>
            </div>
            {wallets.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleExport}
                title={t('batchWallet.export.button')}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {t('batchWallet.results.notice')}
          </div>

          {isGenerating ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              {t('batchWallet.mobile.generating')}
            </div>
          ) : wallets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((wallet, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-card"
                >
                  <QRCodeSVG
                    value={wallet.privateKey}
                    size={160}
                    includeMargin
                    className="bg-white p-2 rounded-lg"
                  />
                  <div className="text-xs text-muted-foreground text-center break-all">
                    {wallet.publicId}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              {t('batchWallet.mobile.empty')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
