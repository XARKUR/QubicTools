"use client"

import { Copy, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { QRCodeSVG } from "qrcode.react"
import { useTranslation } from 'react-i18next'

interface WalletAddress {
  title: string
  address: string
  icon: React.ReactNode
}

interface SponsorDialogProps {
  wallets: WalletAddress[]
}

export function SponsorDialog({ wallets }: SponsorDialogProps) {
  const { t } = useTranslation()
  
  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      toast.success(t('common.copy.success'))
    } catch {
      toast.error(t('common.copy.error'))
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="w-full h-10">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium">{t('common.support.title')}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-medium mb-4">
            <Heart className="h-4 w-4 text-red-500" />
            {t('sponsor.dialog.title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {t('sponsor.dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 mb-4">
          {wallets.map((wallet, index) => (
            <div key={wallet.title} className="w-full flex flex-col items-center gap-4">
              <div className="inline-block border rounded-lg mb-4">
                <div className="flex flex-col items-center p-2">
                  <QRCodeSVG
                    value={wallet.address}
                    size={180}
                    level="H"
                    includeMargin
                    className="rounded"
                  />
                  <div className="text-center text-sm text-muted-foreground mt-1">
                    {t('sponsor.dialog.scanQRCode')}
                  </div>
                </div>
              </div>
              <div className="w-full relative text-sm text-muted-foreground font-mono break-all bg-muted/50 p-3 pr-10 rounded-md group">
                {wallet.address}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => copyToClipboard(wallet.address)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-primary/10 transition-colors h-8 w-8 opacity-0 group-hover:opacity-100"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {index < wallets.length - 1 && (
                <Separator className="mt-3 w-full" />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
