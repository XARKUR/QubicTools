"use client";

import { StatCard } from "@/components/features/home/stat-card"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Clock, DollarSign, Cpu, Box, Boxes } from "lucide-react"
import React, { useMemo, useCallback } from "react"
import { useTranslation } from 'react-i18next';
import { useQubicData } from "@/providers/qubic-data-provider";

function formatIts(its: number): string {
  if (its >= 1e12) return `${(its / 1e12).toFixed(2)} Tit/s`;
  if (its >= 1e9) return `${(its / 1e9).toFixed(2)} Git/s`;
  if (its >= 1e6) return `${(its / 1e6).toFixed(2)} Mit/s`;
  if (its >= 1e3) return `${(its / 1e3).toFixed(2)} Kit/s`;
  return `${its.toFixed(2)} it/s`;
}

function StatCardGridComponent() {
  const { t } = useTranslation();
  const { data, isLoading } = useQubicData();

  const formatUSD = useCallback((value: number, decimals: number = 2) => {
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
  }, []);

  const cards = useMemo(() => [
    {
      title: t('home.stats.currentEpoch.title'),
      value: isLoading ? t('home.stats.loading') : data?.currentEpoch?.toString() || '0',
      description: t('home.stats.currentEpoch.description'),
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: t('home.stats.price.title'),
      value: isLoading ? t('home.stats.loading') : formatUSD(data?.price || 0, 9),
      description: t('home.stats.price.description'),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: t('home.stats.networkHashRate.title'),
      value: isLoading ? t('home.stats.loading') : formatIts(data?.networkHashRate || 0),
      description: t('home.stats.networkHashRate.description'),
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      title: t('home.stats.totalBlocks.title'),
      value: isLoading ? t('home.stats.loading') : (data?.totalBlocks || 0).toLocaleString(),
      description: t('home.stats.totalBlocks.description'),
      icon: <Boxes className="h-4 w-4" />,
    },
    {
      title: t('home.stats.solutionsPerHourCalculated.title'),
      value: isLoading ? t('home.stats.loading') : (data?.solutionsPerHourCalculated || 0).toString(),
      description: t('home.stats.solutionsPerHourCalculated.description'),
      icon: <Box className="h-4 w-4" />,
    },
    {
      title: t('home.stats.solutionsPerHour.title'),
      value: isLoading ? t('home.stats.loading') : (data?.solutionsPerHour || 0).toString(),
      description: t('home.stats.solutionsPerHour.description'),
      icon: <Box className="h-4 w-4" />,
    },
  ], [t, formatUSD, isLoading, data]);

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {cards.map((card, index) => (
        <ErrorBoundary key={index}>
          <StatCard {...card} />
        </ErrorBoundary>
      ))}
    </div>
  );
}

export { StatCardGridComponent as StatCardGrid }
