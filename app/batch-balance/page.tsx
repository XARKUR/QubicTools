"use client"

import { AppSidebar } from "@/components/layout/navigation/sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { useState } from "react"
import { QuerySettingsCard } from "@/components/features/batch-balance/query-settings-card"
import { QueryResultsCard } from "@/components/features/batch-balance/query-results-card"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { toast } from "sonner"
import { useTranslation } from 'react-i18next'

export default function BatchBalance() {
  const { t } = useTranslation()
  const [addresses, setAddresses] = useState<string[]>([])
  const [results, setResults] = useState<Array<{
    id: number;
    address: string;
    balance: number;
    status: "success" | "error";
  }>>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      toast.success(t('common.copy.success'))
    } catch (error) {
      toast.error(t('common.copy.error'))
      console.error("Copy address error:", error)
    }
  }

  const handleDeleteResult = (id: number) => {
    try {
      setResults(prev => prev.filter(result => result.id !== id))
      toast.success(t('batchBalance.toast.success.deleteSuccess'))
    } catch (error) {
      toast.error(t('batchBalance.toast.error.deleteFailed'))
      console.error("Delete result error:", error)
    }
  }

  const handleClearAll = () => {
    try {
      setResults([])
      toast.success(t('batchBalance.toast.success.clearSuccess'))
    } catch (error) {
      toast.error(t('batchBalance.toast.error.clearFailed'))
      console.error("Clear all error:", error)
    }
  }

  const handleSearch = async () => {
    if (addresses.length === 0) {
      toast.error(t('batchBalance.toast.error.emptyAddresses'))
      return
    }

    try {
      setIsLoading(true)
      
      setResults([])
      
      const queue = [...addresses]
      const results: Array<{
        id: number;
        address: string;
        balance: number;
        status: "success" | "error";
      }> = []
      
      const queryBalance = async (address: string, index: number) => {
        try {
          const response = await fetch(`https://rpc.qubic.org/v1/balances/${address}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          })
          
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
          const data = await response.json()
          
          if (data && data.balance && typeof data.balance.balance === 'string') {
            return {
              id: index + 1,
              address: data.balance.id,
              balance: parseInt(data.balance.balance, 10),
              status: "success" as const
            }
          } else {
            throw new Error('Invalid response format')
          }
        } catch (error) {
          console.error(`Error querying balance for ${address}:`, error)
          return {
            id: index + 1,
            address,
            balance: 0,
            status: "error" as const
          }
        }
      }

      const promises = []
      for (let i = 0; i < 1; i++) {
        promises.push(
          (async () => {
            while (queue.length > 0) {
              const address = queue.shift()
              if (!address) break
              
              try {
                const result = await queryBalance(address, results.length)
                results.push(result)
                setResults([...results]) 
              } catch (error) {
                console.error(`Worker ${i} error:`, error)
                const errorResult = {
                  id: results.length + 1,
                  address,
                  balance: 0,
                  status: "error" as const
                }
                results.push(errorResult)
                setResults([...results])
              }
            }
          })()
        )
      }

      await Promise.all(promises)
      
      toast.success(t('batchBalance.toast.success.searchSuccess'))
    } catch (error) {
      toast.error(t('batchBalance.toast.error.searchFailed'))
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader title={t('batchBalance.title')} />
        <div className="flex flex-col gap-4 px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8 lg:px-12 lg:pb-12">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
            <ErrorBoundary>
              <div className="w-full min-w-0">
                <QuerySettingsCard
                  onAddressesChange={(value) => setAddresses(value.split("\n"))}
                  onSearch={handleSearch}
                  isLoading={isLoading}
                />
              </div>
            </ErrorBoundary>
            <ErrorBoundary>
              <div className="w-full min-w-0">
                <QueryResultsCard
                  results={results}
                  onCopyAddress={handleCopyAddress}
                  onDeleteResult={handleDeleteResult}
                  onClearAll={handleClearAll}
                />
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
