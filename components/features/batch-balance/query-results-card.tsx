"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Trash2 } from "lucide-react"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"

/**
 * 
 * @interface QueryResult
 * @property {number} id 
 * @property {string} address 
 * @property {number} balance
 * @property {'success' | 'error'} status
 */
interface QueryResult {
  id: number
  address: string
  balance: number
  status: "success" | "error"
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
 * />
 * ```
 */
export const QueryResultsCard = React.memo(function QueryResultsCard({
  results,
  onCopyAddress,
  onDeleteResult
}: QueryResultsCardProps) {
  const { t } = useTranslation()

  const totalBalance = useMemo(() => {
    return results.reduce((sum, result) => sum + (result.status === 'success' ? result.balance : 0), 0)
  }, [results])

  return (
    <Card className="h-full">
      <CardHeader className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold leading-none tracking-tight">
            {t('batchBalance.results.title')}
          </div>
          <div className="text-sm text-muted-foreground">
            {t('batchBalance.results.totalBalance', { amount: formatBalance(totalBalance) })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 h-[calc(100%-theme(spacing.6)*3)]">
        <div className="h-full w-full rounded-md overflow-x-auto">
          <div className="min-w-[640px] h-[680px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] whitespace-nowrap">{t('batchBalance.results.table.index')}</TableHead>
                  <TableHead>{t('batchBalance.results.table.address')}</TableHead>
                  <TableHead className="text-right w-[160px] whitespace-nowrap">{t('batchBalance.results.table.balance')}</TableHead>
                  <TableHead className="text-center w-[100px] whitespace-nowrap">{t('batchBalance.results.table.status')}</TableHead>
                  <TableHead className="text-center w-[80px] whitespace-nowrap">{t('batchBalance.results.table.actions')}</TableHead>
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
                          title={t('batchBalance.results.actions.copyAddress')}
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
                        title={t('batchBalance.results.actions.delete')}
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
      </CardContent>
    </Card>
  )
})

QueryResultsCard.displayName = 'QueryResultsCard'
