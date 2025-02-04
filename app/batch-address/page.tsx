"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Wallet, HelpCircle, Download, QrCode } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/navigation/sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { NetworkStatusAlert } from "@/components/shared/network-status-alert"
import { useTranslation } from 'react-i18next'
import { SponsorDialog } from "@/components/features/shared/sponsor-dialog"

export default function BatchAddress() {
  const { t } = useTranslation()
  const [forceStart, setForceStart] = useState(false)
  const [walletCount, setWalletCount] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [wallets, setWallets] = useState<Array<{
    publicId: string;
    seed: string;
  }>>([])
  const [showSponsorDialog, setShowSponsorDialog] = useState(false)
  
  const workersRef = useRef<Worker[]>([])
  const completedRef = useRef(0)
  const { isOffline } = useNetworkStatus()

  const handleGenerate = useCallback(async () => {
    const count = parseInt(walletCount)
    if (!count || count <= 0) {
      toast.error(t('batchAddress.toast.invalidCount'))
      return
    }

    const isSecure = forceStart || isOffline;
    if (!isSecure) {
      toast.error(t('batchAddress.toast.networkError'))
      return
    }

    try {
      setIsGenerating(true)
      setProgress(0)
      setWallets([])
      completedRef.current = 0

      workersRef.current.forEach(worker => worker.terminate())
      workersRef.current = []

      const worker = new Worker(new URL('@/workers/wallet.worker.ts', import.meta.url))
      workersRef.current.push(worker)

      worker.onerror = (error) => {
        console.error('Worker error:', error)
        toast.error(t('batchAddress.toast.generateError'))
        setIsGenerating(false)
        worker.terminate()
      }

      const generateRandomSeed = () => {
        const characters = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < 55; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      }

      for (let i = 0; i < count; i++) {
        worker.postMessage({ seed: generateRandomSeed() })
      }

      worker.onmessage = (event) => {
        const { publicId, seed, error } = event.data
        
        if (error) {
          console.error('Worker error:', error)
          toast.error(t('batchAddress.toast.generateError'))
          return
        }

        if (publicId && seed) {
          completedRef.current++
          setProgress(Math.round((completedRef.current / count) * 100))
          
          setWallets(prev => [...prev, { publicId, seed }])

          if (completedRef.current === count) {
            setIsGenerating(false)
            worker.terminate()
            setShowSponsorDialog(true)
            toast.success(t('batchAddress.toast.generateSuccess', { count }))
          }
        }
      }
    } catch (error) {
      console.error("Generate error:", error)
      toast.error(t('batchAddress.toast.generateError'))
      setIsGenerating(false)
    }
  }, [walletCount, forceStart, isOffline, t])

  const handleExport = useCallback(() => {
    const headers = [t('batchAddress.export.headers.index'), t('batchAddress.export.headers.address'), t('batchAddress.export.headers.privateKey')].join(',')
    const rows = wallets.map((wallet, index) => 
      [
        index + 1,
        wallet.publicId,
        wallet.seed
      ].join(',')
    )
    
    const csvContent = [headers, ...rows].join('\n')
    
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
    
    const date = new Date().toISOString().split('T')[0]
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `qubic_wallets_${date}.csv`
    link.click()
    
    setTimeout(() => URL.revokeObjectURL(link.href), 100)
  }, [wallets, t])

  useEffect(() => {
    return () => {
      setWallets([])
      workersRef.current.forEach(worker => worker.terminate())
      workersRef.current = []
      completedRef.current = 0
    }
  }, [])

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <PageHeader title={t('batchAddress.title')} />
          <div className="flex flex-col gap-4 px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8 lg:px-12 lg:pb-12">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
              {/* Left Column */}
              <div className="w-full min-w-0">
                <Card className="h-full">
                  <CardHeader className="p-6">
                    <div className="flex flex-col space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-5 w-5" />
                          <div className="font-semibold leading-none tracking-tight">
                            {t('batchAddress.settings.title')}
                          </div>
                        </div>
                        <NetworkStatusAlert />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-sm text-muted-foreground">
                          {t('batchAddress.settings.offlineNotice')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={forceStart}
                            onCheckedChange={setForceStart}
                            className="h-4 w-7 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
                          />
                          <span className="text-xs whitespace-nowrap">{t('batchAddress.settings.forceStart.label')}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-[200px] text-xs">
                                  {t('batchAddress.settings.forceStart.tooltip')}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-6">
                    {/* Wallet Count Input */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">{t('batchAddress.settings.count.label')}</div>
                      <Input
                        type="number"
                        min="1"
                        value={walletCount}
                        onChange={(e) => setWalletCount(e.target.value)}
                        placeholder={t('batchAddress.settings.count.placeholder')}
                      />
                    </div>

                    {/* Generate Button */}
                    <Button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !walletCount || (!forceStart && !isOffline)}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      {isGenerating ? t('batchAddress.settings.generating', { progress }) : t('batchAddress.settings.start')}
                    </Button>

                    {/* Mobile Wallet Card */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4">
                          <div className="text-sm text-muted-foreground">
                            {t('batchAddress.mobile.description')}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 flex items-center">
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => window.open('https://play.google.com/store/apps/details?id=org.qubic.wallet&hl=en', '_blank')}
                              >
                                <svg className="icon mr-2 h-4 w-4" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M74.481699 15.148138A60.274759 60.274759 0 0 1 146.091079 9.922207c196.64331 109.709241 391.944828 221.819586 587.528827 333.294345-54.519172 55.825655-110.521379 110.274207-164.969931 166.170482l-2.471724 2.259863C405.198389 343.357793 237.33301 181.671724 74.481699 15.148138z m0 0" fill="#0FF07E"></path>
                                  <path d="M53.436734 136.651034c0.211862-40.712828-5.932138-87.322483 21.186207-121.538206C237.474251 181.636414 405.374941 343.322483 566.319492 511.611586q-247.172414 247.84331-494.344827 496.004414a166.700138 166.700138 0 0 1-18.855724-84.744828c0.494345-262.073379 0-524.111448 0.282482-786.184827z m0 0" fill="#10CFFF"></path>
                                  <path d="M733.619906 343.181241c66.171586 36.758069 131.636966 74.71669 197.278897 112.463449a64.54731 64.54731 0 0 1 38.417655 65.818482c-6.779586 28.248276-34.109793 43.184552-57.344 56.496552-59.745103 31.77931-117.230345 68.007724-176.763586 100.352-55.366621-56.496552-112.993103-110.909793-166.558897-168.92469 54.448552-55.860966 110.450759-110.344828 164.969931-166.170482z m0 0" fill="#FFCA0A"></path>
                                  <path d="M566.178251 511.611586l2.471724-2.259862c53.671724 58.014897 111.156966 112.463448 166.523586 168.92469q-289.544828 166.700138-580.466758 330.752a71.468138 71.468138 0 0 1-82.696828-1.412414q246.642759-248.478897 494.168276-496.004414z m0 0" fill="#FA3E4D"></path>
                                </svg>
                                {t('batchAddress.store.googlePlay')}
                              </Button>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <QrCode className="ml-2 h-4 w-4 cursor-pointer hidden sm:block" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="p-2">
                                      <QRCodeSVG value="https://play.google.com/store/apps/details?id=org.qubic.wallet&hl=en" size={150} />
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="flex-1 flex items-center">
                              <Button 
                                variant="outline"
                                className="flex-1"
                                onClick={() => window.open('https://apps.apple.com/us/app/qubic-wallet/id6502265811', '_blank')}
                              >
                                <svg className="icon mr-2 h-4 w-4" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M763.776 968.576H261.504C147.456 968.576 55.04 876.16 55.04 762.112V259.84c0-114.048 92.416-206.464 206.464-206.464h502.272C877.824 53.376 970.24 145.792 970.24 259.84v502.272c0 114.048-92.416 206.464-206.464 206.464zM319.616 687.616c-15.744-6.4-30.592-5.632-42.496-2.304-6.528 1.792-11.904 6.272-15.232 12.032l-16.64 28.416c-12.544 21.504-5.12 48.768 16.128 61.056 7.168 4.096 15.104 6.144 22.784 6.144 15.36 0 30.08-7.936 38.272-22.272l18.944-32.64c4.608-8.064 5.504-17.792 2.048-26.368-3.84-9.6-11.008-18.816-23.808-24.064z" fill="#009CF5"></path>
                                  <path d="M529.792 586.496h-100.48l75.648-130.56 7.68-13.312 51.84-89.088 9.984-17.408 21.504-36.864c9.472-16.128 9.728-36.864-1.024-52.096-9.216-13.056-22.4-18.304-35.456-18.304-15.36 0-30.336 7.936-38.784 22.272l-7.68 13.568-7.936-13.568c-8.448-14.336-23.552-22.272-38.784-22.272-7.68 0-15.36 1.792-22.528 5.888-21.248 12.288-28.544 39.808-16.128 61.056l33.408 57.728-135.168 233.216H238.08c-26.88 0.256-48.384 24.064-44.16 52.096 3.328 22.016 23.936 37.376 46.208 37.376h33.92l103.424-0.256H583.936c3.84 0 7.68-1.664 9.984-4.736 11.776-15.744 20.48-40.192-8.32-65.408-15.232-13.44-35.584-19.328-55.808-19.328z" fill="#FFFFFF"></path>
                                  <path d="M785.28 586.24h-86.016l-115.072-198.528c-2.048-3.456-6.656-4.608-9.856-2.304-16.128 11.648-25.6 27.904-30.464 45.824-8.192 30.208-1.408 62.592 14.208 89.728l24.704 42.88 13.056 22.784 51.84 89.344 5.376 8.96 49.792 86.016c8.448 14.336 23.296 22.272 38.528 22.272 7.68 0 15.616-2.048 22.784-6.144 21.248-12.288 28.544-39.552 16.128-61.056l-29.056-50.304h36.224c26.88 0 48.256-24.32 43.904-52.352-3.584-21.888-23.936-37.12-46.08-37.12zM319.616 687.616c-15.744-6.4-30.592-5.632-42.496-2.304-6.528 1.792-11.904 6.272-15.232 12.032l-16.64 28.416c-12.544 21.504-5.12 48.768 16.128 61.056 7.168 4.096 15.104 6.144 22.784 6.144 15.36 0 30.08-7.936 38.272-22.272l18.944-32.64c4.608-8.064 5.504-17.792 2.048-26.368-3.84-9.6-11.008-18.816-23.808-24.064z" fill="#FFFFFF"></path>
                                </svg>
                                {t('batchAddress.store.appStore')}
                              </Button>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <QrCode className="ml-2 h-4 w-4 cursor-pointer hidden sm:block" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="p-2">
                                      <QRCodeSVG value="https://apps.apple.com/us/app/qubic-wallet/id6502265811" size={150} />
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="w-full min-w-0">
                <Card className="h-full">
                  <CardHeader className="p-6">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="font-semibold leading-none tracking-tight">
                        {t('batchAddress.results.title')}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs px-2"
                        onClick={handleExport}
                        disabled={wallets.length === 0}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        {t('batchAddress.export.button')}
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('batchAddress.results.notice')}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    {/* Results List */}
                    <ScrollArea className="h-[650px] w-full rounded-md">
                      <div className="space-y-4">
                        {wallets.map((wallet, index) => (
                          <div key={index} className="p-4 rounded-lg border">
                            <div className="flex justify-between items-start gap-4 flex-col sm:flex-row">
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium">{t('batchAddress.results.wallet')} #{index + 1}</span>
                                </div>
                                <div className="font-mono text-sm break-all">{wallet.publicId}</div>
                                <div className="text-xs text-muted-foreground">{t('batchAddress.results.scan')}</div>
                              </div>
                              <div className="flex-shrink-0 self-center sm:self-start">
                                <QRCodeSVG value={wallet.seed} size={80} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <SponsorDialog 
            open={showSponsorDialog} 
            onOpenChange={setShowSponsorDialog}
            title={t('sponsor.success.batchAddress.title')}
            description={t('sponsor.success.batchAddress.description')}
          />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
