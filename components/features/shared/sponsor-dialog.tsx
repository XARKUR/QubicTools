"use client"

import { Copy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { QRCodeSVG } from "qrcode.react"
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'

interface SponsorDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  trigger?: React.ReactNode
  wallets?: Array<{
    title: string
    chain: string
    address: string
  }>
}

const DEFAULT_WALLETS = [
  {
    title: "Qubic",
    chain: "qubic",
    address: "XARKUROFQOTNDDSGVGUZSWDEEYMBSXOEAAYGJMUTFDWDMASHMFQPKYIHTPHA"
  },
  {
    title: "ETH",
    chain: "ethereum",
    address: "0xDc12280f38FD02A6c8751E385F74E46AFadebd8e"
  },
  {
    title: "BTC",
    chain: "bitcoin",
    address: "bc1plc6lapvsnwzc6faxufkatu83hjf4ma97uy0ghz8v269f6vphfdws4jhaad"
  },
  {
    title: "SOL",
    chain: "solana",
    address: "3ycJJzoQKzKYQYFxBsoRpqxmPR7t8tUKiYefNjDCCF38"
  }
]

export function SponsorDialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  wallets = DEFAULT_WALLETS
}: SponsorDialogProps) {
  const { t } = useTranslation()
  const [selectedChain, setSelectedChain] = useState("qubic")
  const [isOpen, setIsOpen] = useState(open || false)

  // 同步外部状态
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  // 处理对话框状态变化
  const handleOpenChange = (value: boolean) => {
    setIsOpen(value)
    onOpenChange?.(value)
  }
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('common.copy.success'))
    } catch {
      toast.error(t('common.copy.error'))
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]" aria-describedby="sponsor-dialog-description" aria-labelledby="sponsor-dialog-title">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <DialogHeader>
          <DialogTitle id="sponsor-dialog-title" className="text-l font-semibold text-center flex items-center justify-center gap-2 mt-4">
            {title || t('sponsor.dialog.title')}
          </DialogTitle>
          <DialogDescription id="sponsor-dialog-description" className="text-center pt-2 text-sm">
            {description || t('sponsor.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center mt-4">
          <Tabs defaultValue="qubic" className="w-[212px]" onValueChange={setSelectedChain}>
            <TabsList className="grid w-full grid-cols-4 h-9 dark:bg-muted/50">
              {wallets.map((wallet) => (
                <TabsTrigger key={wallet.chain} value={wallet.chain} className="text-xs font-medium px-0">
                  {wallet.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {wallets.map((wallet) => (
              <TabsContent key={wallet.chain} value={wallet.chain} className="mt-2">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="inline-block border border-border rounded-lg dark:bg-muted/50">
                    <div className="flex flex-col items-center p-4">
                      <QRCodeSVG
                        value={wallet.address}
                        size={180}
                        level="H"
                        includeMargin
                        className="rounded bg-white dark:bg-white"
                      />
                      <div className="text-center text-sm text-muted-foreground mt-2">
                        {t('sponsor.dialog.scanQRCode', { chain: wallet.title })}
                      </div>
                    </div>
                  </div>
                  <div className="w-[350px] relative text-sm text-muted-foreground font-mono break-all bg-muted/50 p-3 pr-10 rounded-md group">
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
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="text-xs text-center text-muted-foreground px-6">
          {t('sponsor.dialog.supportMessage')}
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="flex items-center gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
                {t('common.buttons.nextTime')}
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full">
              <Button 
                className="flex-1" 
                onClick={() => {
                  const wallet = wallets.find(w => w.chain === selectedChain)
                  if (wallet) {
                    copyToClipboard(wallet.address)
                  }
                }}
              >
                {t('common.buttons.copyAddress')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
