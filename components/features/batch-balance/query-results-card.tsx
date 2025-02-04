"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Trash2, Download } from "lucide-react"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"

/**
 * 
 * @interface QueryResult
 * @property {number} id 
 * @property {string} address 
 * @property {number} balance
 * @property {'success' | 'error'} status
 * @property {string} error
 */
interface QueryResult {
  id: number
  address: string
  balance: number
  status: "success" | "error"
  error?: string
}

/**
 * 
 * @interface QueryResultsCardProps
 * @property {QueryResult[]} results 
 * @property {function} onCopyAddress 
 * @property {function} onDeleteResult 
 */
interface QueryResultsCardProps {
  results: QueryResult[]
  onCopyAddress: (address: string) => void
  onDeleteResult: (id: number) => void
  onClearAll: () => void
}

/**
 * 
 * @param {number} balance - 
 * @returns {string} 
 */
const formatBalance = (balance: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(balance)
}

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
 * <QueryResultsCard
 *   results={[
 *     { id: 1, address: "...", balance: 1000000, status: "success" }
 *   ]}
 *   onCopyAddress={(address) => navigator.clipboard.writeText(address)}
 *   onDeleteResult={(id) => handleDelete(id)}
 *   onClearAll={() => handleClearAll()}
 * />
 * ```
 */
export function QueryResultsCard({
  results,
  onCopyAddress,
  onDeleteResult,
  onClearAll
}: QueryResultsCardProps) {
  const { t } = useTranslation()

  const totalBalance = useMemo(() => {
    return results.reduce((sum, result) => sum + (result.status === 'success' ? result.balance : 0), 0)
  }, [results])

  const handleExportCSV = () => {
    try {
      if (!results.length) {
        alert(t('batchBalance.results.noData'))
        return
      }

      // 准备 CSV 数据
      const csvContent = [
        // CSV 头部
        [
          t('batchBalance.export.headers.index'),
          t('batchBalance.export.headers.address'),
          t('batchBalance.export.headers.balance'),
          t('batchBalance.export.headers.status')
        ].join(','),
        // CSV 数据行
        ...results.map(result => [
          result.id,
          result.address,
          formatBalance(result.balance),
          result.status === 'success' ? 'Success' : 'Error'
        ].join(','))
      ].join('\n')

      // 创建 Blob 对象
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      
      // 创建下载链接
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      // 设置下载属性
      link.setAttribute('href', url)
      link.setAttribute('download', `qubic-balances-${new Date().toISOString().split('T')[0]}.csv`)
      
      // 添加到文档并触发下载
      document.body.appendChild(link)
      link.click()
      
      // 清理
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-medium mb-2">
                {t('batchBalance.results.title')}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('batchBalance.results.totalBalance', { amount: formatBalance(totalBalance) })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md h-7 text-xs px-2 text-foreground"
                onClick={handleExportCSV}
                disabled={results.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                {t('batchBalance.button.export')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md h-7 text-xs px-2 text-foreground"
                onClick={() => onClearAll?.()}
                disabled={results.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('batchBalance.button.clear')}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="relative h-[680px] w-full rounded-md border">
          <div className="absolute inset-0 overflow-auto rounded-md">
            <div className="min-w-[640px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <TableHead className="sticky top-0 bg-background w-[80px] whitespace-nowrap first:rounded-tl-md">{t('batchBalance.results.table.index')}</TableHead>
                    <TableHead className="sticky top-0 bg-background">{t('batchBalance.results.table.address')}</TableHead>
                    <TableHead className="sticky top-0 bg-background text-right w-[160px] whitespace-nowrap">{t('batchBalance.results.table.balance')}</TableHead>
                    <TableHead className="sticky top-0 bg-background text-center w-[100px] whitespace-nowrap">{t('batchBalance.results.table.status')}</TableHead>
                    <TableHead className="sticky top-0 bg-background text-center w-[80px] whitespace-nowrap last:rounded-tr-md">{t('batchBalance.results.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="text-center">{result.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm uppercase">
                            {result.address.slice(0, 10)}...{result.address.slice(-10)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => onCopyAddress(result.address)}
                            title={t('batchBalance.results.table.copyAddress')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatBalance(result.balance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.status === 'success' 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {t(`batchBalance.results.status.${result.status}`)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600"
                          onClick={() => onDeleteResult(result.id)}
                          title={t('batchBalance.results.table.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
