"use client";

import { StatCard } from "@/components/features/dashboard/stat-card"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Clock, DollarSign, Landmark, RefreshCcw, Flame, Lock } from "lucide-react"
import React, { useMemo } from "react"
import { useTranslation } from 'react-i18next';
import { useQubicData } from "@/providers/qubic-data-provider";

function formatLargeNumber(num: number, withDollarSign: boolean = false): string {
  if (!num) return withDollarSign ? '$0' : '0';
  
  const prefix = withDollarSign ? '$' : '';
  
  if (num >= 1_000_000_000_000) {
    return `${prefix}${(num / 1_000_000_000_000).toFixed(2)}T`;
  } else if (num >= 1_000_000_000) {
    return `${prefix}${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `${prefix}${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `${prefix}${(num / 1_000).toFixed(2)}K`;
  }
  return `${prefix}${num.toFixed(2)}`;
}

function formatUSD(value: number, decimals: number = 0) {
  const toSubscript = (num: number): string => {
    const subscriptDigits: { [key: string]: string } = {
      '0': '₀',
      '1': '₁',
      '2': '₂',
      '3': '₃',
      '4': '₄',
      '5': '₅',
      '6': '₆',
      '7': '₇',
      '8': '₈',
      '9': '₉'
    };
    return num.toString().split('').map(digit => subscriptDigits[digit]).join('');
  };

  if (decimals === 9) {
    const numStr = value.toFixed(9);
    
    const dotIndex = numStr.indexOf('.');
    
    if (dotIndex === -1) {
      return `$${numStr}`;
    }

    const decimal = numStr.substring(dotIndex + 1);
    
    let zeroCount = 0;
    while (zeroCount < decimal.length && decimal[zeroCount] === '0') {
      zeroCount++;
    }

    if (zeroCount > 0) {
      const nonZeroPart = decimal.substring(zeroCount);
      if (!nonZeroPart) {
        return `$${numStr.substring(0, dotIndex)}`;
      }
      return `$${numStr.substring(0, dotIndex)}.0${toSubscript(zeroCount)}${nonZeroPart}`;
    }

    return `$${numStr}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function parseNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function StatCardGridComponent() {
  const { t } = useTranslation();
  const { data, isLoading } = useQubicData();

  const cards = useMemo(() => [
    {
      title: t('dashboard.stats.currentEpoch.title'),
      value: data?.currentEpoch?.toString() || '0',
      description: t('dashboard.stats.currentEpoch.description'),
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: t('dashboard.stats.price.title'),
      value: formatUSD(data?.price || 0, 9),
      description: t('dashboard.stats.price.description'),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: t('dashboard.stats.marketCap.title'),
      value: formatLargeNumber(parseNumber(data?.marketCap), true),
      description: t('dashboard.stats.marketCap.description'),
      icon: <Landmark className="h-4 w-4" />,
    },
    {
      title: t('dashboard.stats.circulatingSupply.title'),
      value: formatLargeNumber(parseNumber(data?.circulatingSupply)),
      description: t('dashboard.stats.circulatingSupply.description'),
      icon: <RefreshCcw className="h-4 w-4" />,
    },
    {
      title: t('dashboard.stats.burnedQus.title'),
      value: formatLargeNumber(parseNumber(data?.burnedQus)),
      description: t('dashboard.stats.burnedQus.description'),
      icon: <Flame className="h-4 w-4" />,
    },
    {
      title: t('dashboard.stats.totalLocked.title'),
      value: formatLargeNumber(parseNumber(data?.totalLocked)),
      description: t('dashboard.stats.totalLocked.description'),
      icon: <Lock className="h-4 w-4" />,
    },
  ], [t, data]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card, index) => (
        <ErrorBoundary key={index}>
          <StatCard {...card} />
        </ErrorBoundary>
      ))}
    </div>
  );
}

export { StatCardGridComponent as StatCardGrid }
