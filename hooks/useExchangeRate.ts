"use client"

import { useEffect, useState } from 'react'
import { useQubicData } from '@/providers/qubic-data-provider'

interface ExchangeRates {
  usd: number
  cny: number
}

export function useExchangeRate() {
  const { data: qubicData } = useQubicData();
  const [rates, setRates] = useState<ExchangeRates>({ usd: 1, cny: 0 });

  useEffect(() => {
    if (qubicData?.CNY) {
      setRates(prev => ({ ...prev, cny: qubicData.CNY }));
    }
  }, [qubicData?.CNY]);

  const formatCurrency = (amount: number, decimals: number = 2) => {
    if (!amount || isNaN(amount)) {
      return '0.00'
    }

    return amount.toFixed(decimals)
  }

  const formatUSD = (amount: number, decimals: number = 2) => {
    return `$${formatCurrency(amount, decimals)}`
  }

  const formatCNY = (amount: number, decimals: number = 2) => {
    if (!rates.cny) return `¥${formatCurrency(0, decimals)}`;
    const cnyAmount = amount * rates.cny;
    return `¥${formatCurrency(cnyAmount, decimals)}`
  }

  return {
    rates,
    formatUSD,
    formatCNY,
  }
}
