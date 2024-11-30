"use client";

import { StatCard } from "@/components/features/home/stat-card"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Clock, DollarSign, Cpu, Box, Coins, Wallet } from "lucide-react"
import React, { useEffect, useState, useMemo, useCallback } from "react"
import QubicAPI from '@/services/api';
import { handleAPIError } from '@/utils/error-handler';
import { BlockValueData } from "@/types/api";
import { useTranslation } from 'react-i18next';
import { useExchangeRate } from '@/hooks/useExchangeRate';

// 导出计算好的数据的hook
export const useBlockValue = () => {
  const [blockValue, setBlockValue] = useState<BlockValueData>({
    blockValueUSD: 0,
    networkHashRate: 0,
    solutionsPerHour: 0,
    currentEpoch: 0,
    price: 0,
    coinsPerSolution: 0,
  });
  const [isIdle, setIsIdle] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const fetchBlockValue = useCallback(async () => {
    try {
      const [blockData, idleStatus] = await Promise.all([
        QubicAPI.getBlockValue(),
        QubicAPI.getIdleStatus()
      ]);

      // 验证数据有效性
      if (!blockData || typeof blockData.price !== 'number' || blockData.price < 0) {
        throw new Error('Invalid block value data');
      }

      // 保持当前价格，如果新价格无效
      if (blockData.price === 0 && blockValue.price > 0) {
        blockData.price = blockValue.price;
      }

      setBlockValue(blockData);
      setIsIdle(idleStatus.idle);
      setError(null);
      setRetryCount(0); // 重置重试计数
    } catch (error) {
      console.error('Error fetching block value:', error);
      
      // 如果还没有达到最大重试次数，增加重试计数并继续
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        // 指数退避重试
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(fetchBlockValue, delay);
      } else {
        setError(error instanceof Error ? error : new Error('Failed to fetch data'));
        handleAPIError(error, '获取数据失败');
      }
    }
  }, [retryCount, blockValue.price]);

  useEffect(() => {
    let mounted = true;
    
    const initialFetch = async () => {
      if (!mounted) return;
      setIsLoading(true);
      await fetchBlockValue();
      if (mounted) {
        setIsLoading(false);
      }
    };

    initialFetch();

    const interval = setInterval(() => {
      if (mounted) {
        fetchBlockValue();
      }
    }, 300000); // 5分钟更新一次

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchBlockValue]);

  return {
    ...blockValue,
    isLoading,
    isIdle,
    error
  };
};

function formatIts(its: number): string {
  if (its >= 1e12) return `${(its / 1e12).toFixed(2)} Tit/s`;
  if (its >= 1e9) return `${(its / 1e9).toFixed(2)} Git/s`;
  if (its >= 1e6) return `${(its / 1e6).toFixed(2)} Mit/s`;
  if (its >= 1e3) return `${(its / 1e3).toFixed(2)} Kit/s`;
  return `${its.toFixed(2)} it/s`;
}

function StatCardGridComponent() {
  const { t } = useTranslation();
  const { formatCurrency } = useExchangeRate();
  const { 
    blockValueUSD, 
    networkHashRate, 
    solutionsPerHour, 
    isLoading, 
    currentEpoch, 
    price, 
    coinsPerSolution, 
    isIdle
  } = useBlockValue();

  const cards = useMemo(() => [
    {
      title: t('home.stats.currentEpoch.title'),
      value: isLoading ? t('home.stats.loading') : currentEpoch?.toString() || '0',
      description: t('home.stats.currentEpoch.description'),
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: t('home.stats.price.title'),
      value: isLoading ? t('home.stats.loading') : formatCurrency(price),
      description: t('home.stats.price.description'),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: t('home.stats.networkHashRate.title'),
      value: isLoading ? t('home.stats.loading') : (isIdle ? "idle" : formatIts(networkHashRate || 0)),
      description: t('home.stats.networkHashRate.description'),
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      title: t('home.stats.solutionsPerHour.title'),
      value: isLoading ? t('home.stats.loading') : (solutionsPerHour || 0).toString(),
      description: t('home.stats.solutionsPerHour.description'),
      icon: <Box className="h-4 w-4" />,
    },
    {
      title: t('home.stats.coinsPerSolution.title'),
      value: isLoading ? t('home.stats.loading') : (coinsPerSolution || 0).toFixed(0).toString(),
      description: t('home.stats.coinsPerSolution.description'),
      icon: <Coins className="h-4 w-4" />,
    },
    {
      title: t('home.stats.blockValue.title'),
      value: isLoading ? t('home.stats.loading') : formatCurrency(blockValueUSD || 0, 2),
      description: t('home.stats.blockValue.description'),
      icon: <Wallet className="h-4 w-4" />,
    }
  ], [isLoading, currentEpoch, price, networkHashRate, solutionsPerHour, coinsPerSolution, blockValueUSD, isIdle, t, formatCurrency]);

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {cards.map((card, index) => (
        <ErrorBoundary key={index}>
          <StatCard {...card} />
        </ErrorBoundary>
      ))}
    </div>
  )
}

export { StatCardGridComponent as StatCardGrid }
