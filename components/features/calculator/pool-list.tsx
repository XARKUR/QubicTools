"use client"

import React from "react"
import { PoolCard } from "./pool-card"
import { useTranslation } from 'react-i18next'
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type SystemType = 'windows' | 'linux' | 'macos' | 'hiveos' | 'docker' | 'android'

interface SystemBadgeProps {
  type: SystemType
  className?: string
}

const SystemBadge = React.memo(function SystemBadgeComponent({ type, className }: SystemBadgeProps) {
  const { t } = useTranslation()
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "mr-2 text-xs",
        type === 'windows' && "border-blue-400 text-blue-400",
        type === 'linux' && "border-orange-400 text-orange-400",
        type === 'android' && "border-green-400 text-green-400",
        type === 'hiveos' && "border-yellow-400 text-yellow-400",
        type === 'docker' && "border-teal-400 text-teal-400",
        className
      )}
    >
      {t(`calculator.pool.systems.${type}`)}
    </Badge>
  )
})

SystemBadge.displayName = "SystemBadge"

const pools = [
  {
    id: "qli",
    fee: "10% / 15%",
    website: "https://pool.qubic.li",
    tutorial: "https://github.com/qubic-li/client",
    community: "https://discord.gg/qubic",
    features: [],
    systems: ['windows', 'linux', 'hiveos', 'docker'] as SystemType[]
  },
  {
    id: "minerlab",
    fee: "10%",
    website: "https://qubic.minerlab.io/",
    tutorial: "https://qubic.minerlab.io/overview",
    community: "https://discord.com/invite/CtT3mtxSpY",
    features: [],
    systems: ['windows', 'linux', 'hiveos'] as SystemType[]
  },
  {
    id: "apool",
    fee: "10%",
    website: "https://www.apool.io/",
    tutorial: "https://apool.gitbook.io/help",
    community: "https://discord.com/invite/jpV4V2dUG6",
    features: [],
    systems: ['windows', 'linux', 'hiveos'] as SystemType[]
  },
  {
    id: "solutions",
    fee: "10%",
    website: "https://qubic.solutions/",
    tutorial: "https://github.com/Qubic-Solutions/.github/tree/main/profile",
    community: "https://discord.gg/2Cuc765D6N",
    features: [],
    systems: ['windows', 'linux', 'hiveos', 'android'] as SystemType[]
  },
  {
    id: "nevermine",
    fee: "10%",
    website: "https://nevermine.io/",
    tutorial: "https://nevermine.io/get-started/qubic",
    community: "https://discord.com/invite/YVPzYhQ66N",
    features: [],
    systems: ['windows', 'linux', 'hiveos'] as SystemType[]
  }
]

const PoolList = React.memo(function PoolListComponent() {
  const { t } = useTranslation()

  return (
    <div className="space-y-3 sm:space-y-4">
      {pools.map((pool) => (
        <PoolCard
          key={pool.id}
          name={t(`calculator.pool.pools.${pool.id}.name`)}
          description={t(`calculator.pool.pools.${pool.id}.description`)}
          features={pool.features}
          fee={pool.fee}
          website={pool.website}
          tutorial={pool.tutorial}
          community={pool.community}
          systems={pool.systems}
        />
      ))}
    </div>
  )
})

PoolList.displayName = "PoolList"

export { PoolList, SystemBadge }
export type { SystemType }
