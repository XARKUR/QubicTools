"use client"

import { memo, useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, QrCode } from "lucide-react"
import { QRCodeSVG } from 'qrcode.react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from 'react-i18next'
import { toast } from "sonner"

/**
 * 
 * @interface ResultCardProps
 * @property {string} publicId 
 * @property {string} privateKey 
 */
interface ResultCardProps {
  publicId: string
  privateKey: string
}

export const ResultCard = memo<ResultCardProps>(({
  publicId,
  privateKey
}) => {
  const { t } = useTranslation()
  const [truncatedAddress, setTruncatedAddress] = useState(publicId);
  const [showFullAddress, setShowFullAddress] = useState(true);

  /**
   * 
   * @param {string} address 
   * @param {number} containerWidth 
   * @returns {string} 
   */
  const truncateAddress = (address: string, containerWidth: number) => {
    if (!address || address.length <= 20) return address;
    
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'nowrap';
    tempSpan.style.fontFamily = 'monospace';
    tempSpan.style.fontSize = '14px';
    tempSpan.textContent = address;
    document.body.appendChild(tempSpan);
    
    const textWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);
    
    if (textWidth > containerWidth) {
      return `${address.slice(0, 10)}...${address.slice(-10)}`;
    }
    
    return address;
  };

  const updateAddressDisplay = useCallback(() => {
    const container = document.querySelector('.address-container');
    if (container) {
      const width = container.clientWidth - 40; 
      const newTruncatedAddress = truncateAddress(publicId, width);
      setShowFullAddress(newTruncatedAddress === publicId);
      setTruncatedAddress(newTruncatedAddress);
    }
  }, [publicId]);

  /**
   * 
   * 
   */
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(publicId);
      toast.success(t('common.copy.success'));
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error(t('common.copy.error'));
    }
  }

  useEffect(() => {
    updateAddressDisplay();
    window.addEventListener('resize', updateAddressDisplay);
    return () => window.removeEventListener('resize', updateAddressDisplay);
  }, [updateAddressDisplay]);

  return (
    <Card>
      <CardHeader className="p-6">
        <div className="font-semibold leading-none tracking-tight mb-3">
          {t('vanityAddress.result.title')}
        </div>
        <div className="text-sm text-muted-foreground">
          {t('vanityAddress.result.warning')}
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-[200px_1fr]">
          {/* QR Code Section */}
          <div className="flex items-center justify-center">
            <div className="overflow-hidden rounded-xl border bg-white p-4">
              <QRCodeSVG
                value={privateKey}
                size={168}
                level="L"
                className="[&>path:first-child]:fill-white"
              />
              <div className="mt-4 text-center text-xs text-muted-foreground">
                {t('vanityAddress.result.scanQRCode')}
              </div>
            </div>
          </div>

          {/* Address and Private Key Section */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>{t('vanityAddress.result.publicId')}</Label>
              <div className="relative address-container">
                <Input
                  type="text"
                  value={truncatedAddress}
                  readOnly
                  className="pr-20 font-mono text-sm"
                  title={!showFullAddress ? publicId : undefined}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={handleCopyAddress}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="text-sm text-muted-foreground">
                    {t('vanityAddress.result.warningClipboard')}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => window.open('https://play.google.com/store/apps/details?id=org.qubic.wallet&hl=en', '_blank')}
                      >
                        <svg className="icon mr-2 h-4 w-4" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1566">
                          <path d="M74.481699 15.148138A60.274759 60.274759 0 0 1 146.091079 9.922207c196.64331 109.709241 391.944828 221.819586 587.528827 333.294345-54.519172 55.825655-110.521379 110.274207-164.969931 166.170482l-2.471724 2.259863C405.198389 343.357793 237.33301 181.671724 74.481699 15.148138z m0 0" fill="#0FF07E" p-id="1567"></path>
                          <path d="M53.436734 136.651034c0.211862-40.712828-5.932138-87.322483 21.186207-121.538206C237.474251 181.636414 405.374941 343.322483 566.319492 511.611586q-247.172414 247.84331-494.344827 496.004414a166.700138 166.700138 0 0 1-18.855724-84.744828c0.494345-262.073379 0-524.111448 0.282482-786.184827z m0 0" fill="#10CFFF" p-id="1568"></path>
                          <path d="M733.619906 343.181241c66.171586 36.758069 131.636966 74.71669 197.278897 112.463449a64.54731 64.54731 0 0 1 38.417655 65.818482c-6.779586 28.248276-34.109793 43.184552-57.344 56.496552-59.745103 31.77931-117.230345 68.007724-176.763586 100.352-55.366621-56.496552-112.993103-110.909793-166.558897-168.92469 54.448552-55.860966 110.450759-110.344828 164.969931-166.170482z m0 0" fill="#FFCA0A" p-id="1569"></path>
                          <path d="M566.178251 511.611586l2.471724-2.259862c53.671724 58.014897 111.156966 112.463448 166.523586 168.92469q-289.544828 166.700138-580.466758 330.752a71.468138 71.468138 0 0 1-82.696828-1.412414q246.642759-248.478897 494.168276-496.004414z m0 0" fill="#FA3E4D" p-id="1570"></path>
                        </svg>
                        {t('vanityAddress.result.googlePlay')}
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
                        {t('vanityAddress.result.appStore')}
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

ResultCard.displayName = "ResultCard"
