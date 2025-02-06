"use client";

import { StatCard } from "@/components/features/calculator/stat-card"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Clock, DollarSign, Cpu, Box, Boxes } from "lucide-react"
import React, { useMemo, useCallback } from "react"
import { useTranslation } from 'react-i18next';
import { useQubicData } from "@/providers/qubic-data-provider";

function formatIts(its: number): string {
  if (its >= 1e12) return `${(its / 1e12).toFixed(2)} Tit/s`;
  if (its >= 1e9) return `${(its / 1e9).toFixed(2)} Bit/s`;
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
      title: t('calculator.stats.currentEpoch.title'),
      value: data?.currentEpoch?.toString() || '0',
      description: t('calculator.stats.currentEpoch.description'),
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: t('calculator.stats.price.title'),
      value: formatUSD(data?.price || 0, 9),
      description: t('calculator.stats.price.description'),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: t('calculator.stats.networkHashRate.title'),
      value: formatIts(data?.networkHashRate || 0),
      description: t('calculator.stats.networkHashRate.description'),
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      title: t('calculator.stats.totalBlocks.title'),
      value: (data?.totalBlocks || 0).toLocaleString(),
      description: t('calculator.stats.totalBlocks.description'),
      icon: <Boxes className="h-4 w-4" />,
    },
    {
      title: t('calculator.stats.solutionsPerHourCalculated.title'),
      value: (data?.solutionsPerHourCalculated || 0).toString(),
      description: t('calculator.stats.solutionsPerHourCalculated.description'),
      icon: <Box className="h-4 w-4" />,
    },
    {
      title: t('calculator.stats.solutionsPerHour.title'),
      value: (data?.solutionsPerHour || 0).toString(),
      description: t('calculator.stats.solutionsPerHour.description'),
      icon: <Box className="h-4 w-4" />,
    },
  ], [t, formatUSD, data]);

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
