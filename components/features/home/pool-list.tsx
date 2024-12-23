"use client"

import React from "react"
import { PoolCard } from "./pool-card"
import { useTranslation } from 'react-i18next'

const pools = [
  {
    id: "qli",
    fee: "10% / 15%",
    website: "https://pool.qubic.li",
    tutorial: "https://github.com/qubic-li/client",
    community: "https://discord.gg/qubic",
    features: [
    ]
  },
  {
    id: "minerlab",
    fee: "10%",
    website: "https://qubic.minerlab.io/",
    tutorial: "https://qubic.minerlab.io/overview",
    community: "https://discord.com/invite/CtT3mtxSpY",
    features: [
    ]
  },
  {
    id: "apool",
    fee: "10%",
    website: "https://www.apool.io/",
    tutorial: "https://apool.gitbook.io/help",
    community: "https://discord.com/invite/jpV4V2dUG6",
    features: [
    ]
  },
  {
    id: "solutions",
    fee: "10%",
    website: "https://qubic.solutions/",
    tutorial: "https://github.com/Qubic-Solutions/.github/tree/main/profile",
    community: "https://discord.gg/2Cuc765D6N",
    features: [
    ]
  }
]

const PoolList = React.memo(function PoolListComponent() {
  const { t } = useTranslation()

  return (
    <div className="space-y-3 sm:space-y-4">
      {pools.map((pool) => (
        <PoolCard
          key={pool.id}
          name={t(`home.pool.pools.${pool.id}.name`)}
          description={t(`home.pool.pools.${pool.id}.description`)}
          features={pool.features}
          fee={pool.fee}
          website={pool.website}
          tutorial={pool.tutorial}
          community={pool.community}
        />
      ))}
    </div>
  )
})

PoolList.displayName = "PoolList"

export { PoolList }
