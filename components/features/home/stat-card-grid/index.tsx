"use client";

import { StatCard } from "@/components/features/home/stat-card"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Clock, DollarSign, Cpu, Box, Boxes } from "lucide-react"
import React, { useEffect, useState, useMemo, useCallback } from "react"
import QubicAPI from '@/services/api';
import { handleAPIError } from '@/utils/error-handler';
import { useTranslation } from 'react-i18next';

// 导出计算好的数据的hook
export const useBlockValue = () => {
  const [blockValue, setBlockValue] = useState({
    blockValueUSD: 0,
    networkHashRate: 0,
    solutionsPerHour: 0,
    solutionsPerHourCalculated: 0,
    totalBlocks: 0,
    currentEpoch: 0,
    price: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const fetchBlockValue = useCallback(async () => {
    try {
      const blockData = await QubicAPI.getBlockValue();

      // 验证数据有效性
      if (!blockData || typeof blockData.price !== 'number' || blockData.price < 0) {
        throw new Error('Invalid block value data');
      }

      // 保持当前价格，如果新价格无效
      if (blockData.price === 0 && blockValue.price > 0) {
        blockData.price = blockValue.price;
      }

      setBlockValue(blockData);
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
  const { 
    networkHashRate, 
    solutionsPerHour,
    solutionsPerHourCalculated,
    totalBlocks,
    isLoading, 
    currentEpoch, 
    price,
  } = useBlockValue();

  // 格式化美元金额的辅助函数
  const formatUSD = useCallback((value: number, decimals: number = 2) => {
    // 将数字转换为下标数字的辅助函数
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
      // 将数字转换为字符串，固定9位小数
      const numStr = value.toFixed(9);
      
      // 找到小数点位置
      const dotIndex = numStr.indexOf('.');
      
      if (dotIndex === -1) {
        return `$${numStr}`;
      }

      // 获取小数部分
      const decimal = numStr.substring(dotIndex + 1);
      
      // 计算开头连续的零的个数
      let zeroCount = 0;
      while (zeroCount < decimal.length && decimal[zeroCount] === '0') {
        zeroCount++;
      }

      // 如果有连续的零
      if (zeroCount > 0) {
        // 获取非零部分
        const nonZeroPart = decimal.substring(zeroCount);
        // 如果全是零，直接返回整数部分
        if (!nonZeroPart) {
          return `$${numStr.substring(0, dotIndex)}`;
        }
        // 返回格式化后的字符串，使用下标表示零的个数
        return `$${numStr.substring(0, dotIndex)}.0${toSubscript(zeroCount)}${nonZeroPart}`;
      }

      return `$${numStr}`;
    }

    // 其他情况使用标准格式化
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
      value: isLoading ? t('home.stats.loading') : currentEpoch?.toString() || '0',
      description: t('home.stats.currentEpoch.description'),
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: t('home.stats.price.title'),
      value: isLoading ? t('home.stats.loading') : formatUSD(price, 9),
      description: t('home.stats.price.description'),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: t('home.stats.networkHashRate.title'),
      value: isLoading ? t('home.stats.loading') : formatIts(networkHashRate || 0),
      description: t('home.stats.networkHashRate.description'),
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      title: t('home.stats.totalBlocks.title'),
      value: isLoading ? t('home.stats.loading') : (totalBlocks || 0).toLocaleString(),
      description: t('home.stats.totalBlocks.description'),
      icon: <Boxes className="h-4 w-4" />,
    },
    {
      title: t('home.stats.solutionsPerHourCalculated.title'),
      value: isLoading ? t('home.stats.loading') : (solutionsPerHourCalculated || 0).toString(),
      description: t('home.stats.solutionsPerHourCalculated.description'),
      icon: <Box className="h-4 w-4" />,
    },
    {
      title: t('home.stats.solutionsPerHour.title'),
      value: isLoading ? t('home.stats.loading') : (solutionsPerHour || 0).toString(),
      description: t('home.stats.solutionsPerHour.description'),
      icon: <Box className="h-4 w-4" />,
    },
  ], [t, formatUSD, isLoading, currentEpoch, price, networkHashRate, totalBlocks, solutionsPerHourCalculated, solutionsPerHour]);

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
