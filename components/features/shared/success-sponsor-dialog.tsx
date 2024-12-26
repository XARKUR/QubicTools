"use client"

import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { QRCodeSVG } from "qrcode.react"
import { useTranslation } from 'react-i18next'

interface SuccessSponsorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

const SPONSOR_ADDRESS = "XARKUROFQOTNDDSGVGUZSWDEEYMBSXOEAAYGJMUTFDWDMASHMFQPKYIHTPHA"

export function SuccessSponsorDialog({
  open,
  onOpenChange,
  title,
  description
}: SuccessSponsorDialogProps) {
  const { t } = useTranslation()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('common.copy.success'))
    } catch {
      toast.error(t('common.copy.error'))
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px] gap-0">
        <AlertDialogHeader className="pb-2">
          <AlertDialogTitle className="text-l font-semibold text-center">
            {title || t('sponsor.success.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center pt-2 text-sm">
            {description || t('sponsor.success.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          <div className="bg-white p-2 rounded-lg">
            <QRCodeSVG
              value={SPONSOR_ADDRESS}
              size={160}
              includeMargin={false}
            />
          </div>

          <div className="mt-3 text-sm font-medium text-muted-foreground">
            {t('sponsor.dialog.scanQRCode')}
          </div>

          <div className="w-full relative text-sm text-muted-foreground font-mono break-all bg-muted/50 p-3 pr-10 rounded-md group mt-4">
            {SPONSOR_ADDRESS}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => copyToClipboard(SPONSOR_ADDRESS)}
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-primary/10 transition-colors h-8 w-8 opacity-0 group-hover:opacity-100"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-xs text-center text-muted-foreground px-6 pb-4">
          {t('sponsor.dialog.supportMessage')}
        </div>


        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
              {t('common.buttons.nextTime')}
            </Button>
            <Button  onClick={() => copyToClipboard(SPONSOR_ADDRESS)}>
              {t('common.buttons.copyAddress')}
            </Button>
          </div>
        </AlertDialogFooter>

      </AlertDialogContent>
    </AlertDialog>
  )
}
