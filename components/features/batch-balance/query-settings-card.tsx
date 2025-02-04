"use client";

import { Card, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, Upload, Loader2, ScanSearch, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { QueryResult } from "@/types/query-result"

/**
 * 
 * @interface QuerySettingsCardProps
 * @property {function} onAddressesChange 
 * @property {function} onSearch 
 * @property {function} onResults 
 * @property {boolean} [isLoading] 
 */
interface QuerySettingsCardProps {
  onAddressesChange: (value: string) => void
  onSearch: () => void
  onResults?: (results: QueryResult[]) => void
  isLoading?: boolean
}

/**
 * 
 * @interface LineNumberedTextareaProps
 * @property {string} value 
 * @property {function} onChange 
 */
interface LineNumberedTextareaProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

/**
 * 
 * 
 * 
 * @component
 */
const LineNumberedTextarea = React.memo(function LineNumberedTextarea({
  value,
  onChange
}: LineNumberedTextareaProps) {
  const { t } = useTranslation()
  const [lineCount, setLineCount] = React.useState(1)

  useEffect(() => {
    const lines = (value || '').split('\n').length
    setLineCount(Math.max(1, lines))
  }, [value])

  return (
    <div className="relative flex h-[600px] rounded-md border border-input bg-transparent text-sm shadow-sm focus-within:ring-ring">
      <ScrollArea className="flex w-full h-full">
        <div className="flex min-h-full">
          {/* */}
          <div className="flex-none w-12 bg-muted/30 rounded-l-md border-r border-input">
            <div className="py-2">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1} className="h-[20px] text-xs text-muted-foreground select-none leading-[20px] text-center">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
          {/* */}
          <div className="flex-1">
            <textarea
              value={value}
              onChange={onChange}
              className="w-full h-full min-h-[600px] resize-none bg-transparent p-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 font-mono leading-[20px]"
              placeholder={t('batchBalance.settings.addressList.placeholder')}
              style={{ overflow: 'hidden' }}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
})

LineNumberedTextarea.displayName = 'LineNumberedTextarea'

/**
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * @component
 * @example
 * ```tsx
 * <QuerySettingsCard
 *   onAddressesChange={setAddresses}
 *   onSearch={handleSearch}
 *   isLoading={false}
 * />
 * ```
 */
export const QuerySettingsCard = React.memo(function QuerySettingsCard({
  onAddressesChange,
  onSearch,
  onResults,
  isLoading = false
}: QuerySettingsCardProps) {
  const { t } = useTranslation()
  const [addresses, setAddresses] = React.useState("")

  /**
   * 
   */
  const handleAddressesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setAddresses(value)
    onAddressesChange(value)
  }

  /**
   * 
   * 
   */
  const handleFileUpload = async (e: Event) => {
    try {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      const text = await file.text();
      setAddresses(text);
      onAddressesChange(text);
    } catch (error) {
      console.error("File upload error:", error);
      // toast.error(t('batchBalance.toast.error.uploadFailed'))
    }
  };

  const handleSearch = () => {
    onSearch();
    if (onResults) {
      onResults([
        {
          id: 1,
          address: addresses.split('\n')[0] || '',
          balance: 0,
          status: "success"
        }
      ]);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="p-6">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <ScanSearch className="h-5 w-5" />
            <div className="font-semibold leading-none tracking-tight">
              {t('batchBalance.title')}
            </div>
          </div>
          <div className="flex flex-col space-y-3 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('batchBalance.settings.addressList.label')}</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md h-7 text-xs px-2 text-foreground"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.txt'
                      input.onchange = handleFileUpload
                      input.click()
                    }}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    {t('batchBalance.button.import')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md h-7 text-xs px-2 text-foreground"
                    onClick={() => {
                      setAddresses("");
                      onAddressesChange("");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    {t('batchBalance.button.clear')}
                  </Button>
                </div>
              </div>
              <div className="relative">
                <LineNumberedTextarea
                  value={addresses}
                  onChange={handleAddressesChange}
                />
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !addresses.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('batchBalance.settings.search.loading')}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {t('batchBalance.settings.search.button')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
})

QuerySettingsCard.displayName = 'QuerySettingsCard'
