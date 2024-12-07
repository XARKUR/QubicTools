import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface ExchangeRates {
  usd: number
  cny: number
}

export function useExchangeRate() {
  const { i18n } = useTranslation()
  const [rates, setRates] = useState<ExchangeRates>({ usd: 1, cny: 7.2 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.qubic.site/api/qubic/rates')
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates')
        }
        const data = await response.json()
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid exchange rate data')
        }

        const usdRate = parseFloat(data.usd)
        const cnyRate = parseFloat(data.cny)

        if (isNaN(usdRate) || isNaN(cnyRate) || usdRate <= 0 || cnyRate <= 0) {
          return 
        }

        setRates({
          usd: usdRate,
          cny: cnyRate
        })
        setError(null)
      } catch (err) {
        console.error('Error fetching rates:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRates()
    const interval = setInterval(fetchRates, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (amount: number, decimals: number = 8) => {
    const value = parseFloat(String(amount))
    if (isNaN(value) || value === 0) {
      return i18n.language.toLowerCase() === 'zh' ? '¥0.00' : '$0.00'
    }

    if (i18n.language.toLowerCase() === 'zh') {
      const cnyAmount = value * rates.cny
      return `¥${cnyAmount.toFixed(decimals)}`
    }
    
    return `$${value.toFixed(decimals)}`
  }

  return {
    rates,
    loading,
    error,
    formatCurrency
  }
}
