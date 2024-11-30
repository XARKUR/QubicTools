"use client"

import React, { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import QubicAPI from '@/services/api'
import { handleAPIError } from '@/utils/error-handler'
import { useTranslation } from 'react-i18next'

type SponsorLevel = "spark" | "starlight" | "meteor" | "star" | "supernova"

interface SponsorData {
  address: string
  amount: number
  level: SponsorLevel
}

function getLevelColor(level: SponsorLevel): string {
  switch (level) {
    case "spark":
      return "text-orange-400"
    case "starlight":
      return "text-blue-400"
    case "meteor":
      return "text-purple-500"
    case "star":
      return "text-yellow-500"
    case "supernova":
      return "text-red-500"
  }
}

function determineLevel(amount: number): SponsorLevel {
  if (amount >= 1000000000) return "supernova"
  if (amount >= 100000000) return "star"
  if (amount >= 10000000) return "meteor"
  if (amount >= 1000000) return "starlight"
  return "spark"
}

const SponsorList = React.memo(function SponsorListComponent() {
  const { t } = useTranslation()
  const [sponsors, setSponsors] = useState<SponsorData[]>([]);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const response = await QubicAPI.getTransfers();
        
        // 获取所有交易
        const transactions = response.data?.transfers?.transactions || [];
        
        // 处理交易数据
        const processedSponsors = transactions
          .flatMap((tick: { transactions: Array<{ transaction: { sourceId: string; amount: string } }> }) => 
            tick.transactions.map(trans => ({
              address: trans.transaction.sourceId,
              amount: Number(trans.transaction.amount),
              level: determineLevel(Number(trans.transaction.amount))
            }))
          )
          .filter((sponsor: SponsorData) => sponsor.address && sponsor.amount > 0)
          .sort((a: SponsorData, b: SponsorData) => b.amount - a.amount); // 按金额降序排序

        setSponsors(processedSponsors);
      } catch (error) {
        handleAPIError(error);
        console.error('Error fetching sponsors:', error);
        setSponsors([]); // 错误时设置空数组
      }
    };

    fetchSponsors();
    const interval = setInterval(fetchSponsors, 300000); // 每5分钟更新一次
    return () => clearInterval(interval);
  }, []);

  const formatAddress = (address: string) => {
    const start = address.slice(0, 10)
    const end = address.slice(-10)
    return `${start}...${end}`
  }

  return (
    <div className="overflow-hidden h-[calc(43rem)] relative">
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent z-10" />
      <div className="animate-marquee">
        <Table>
          <TableBody>
            {[...sponsors, ...sponsors, ...sponsors].map((sponsor, index) => (
              <TableRow 
                key={`${sponsor.address}-${index}`}
                className="group hover:bg-muted/50 transition-colors"
              >
                <TableCell className="py-1.5">
                  <Badge 
                    key={sponsor.level}
                    data-testid="sponsor-badge"
                    variant="secondary" 
                    className={`${getLevelColor(sponsor.level)} text-xs font-normal`}
                  >
                    {t(`sponsor.level.${sponsor.level}`)}
                  </Badge>
                </TableCell>
                <TableCell className="py-1.5 text-right">
                  <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {formatAddress(sponsor.address)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
})

SponsorList.displayName = "SponsorList"

export { SponsorList }
