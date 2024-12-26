"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import QubicAPI from '@/services/api';
import { handleAPIError } from '@/utils/error-handler';

interface QubicToolData {
  networkHashRate: number;
  averageHashrate: number;
  averageApoolHashrate: number;
  averageMinerlabHashrate: number;
  averageNevermineHashrate: number;
  averageSolutionsHashrate: number;
  solutionsPerHour: number;
  solutionsPerHourCalculated: number;
  price: number;
  currentEpoch: number;
  totalBlocks: number;
  idle: boolean;
  CNY: number;
  proposal?: {
    epoch: number;
    hasVotes: boolean;
    options: {
      index: number;
      label: string;
      value?: string;
      votes: number;
    }[];
    proposalType: string;
    published: string;
    status: number;
    title: string;
    totalVotes: number;
    url: string;
  };
  apoolStats: {
    accepted_solution: number;
    corrected_hashrate: number;
    pool_hash: number;
    shares_per_solution: number;
    total_share: number;
  };
  minerlabStats: {
    accepted_solution: number;
    corrected_hashrate: number;
    pool_hash: number;
  };
  nevermineStats: {
    accepted_solution: number;
    corrected_hashrate: number;
    pool_hash: number;
    shares_per_solution: number;
    total_share: number;
  };
  solutionsStats: {
    accepted_solution: number;
    corrected_hashrate: number;
    pool_hash: number;
    shares_per_solution: number;
    total_share: number;
    pplns_solutions: number;
    solo_solutions: number;
  };
  poolHashrate: {
    average: {
      average_apool_hashrate: number;
      average_minerlab_hashrate: number;
      average_nevermine_hashrate: number;
      average_qli_hashrate: number;
      average_solutions_hashrate: number;
      record_count: number;
    };
    current: {
      apool_hashrate: number;
      minerlab_hashrate: number;
      nevermine_hashrate: number;
      qli_hashrate: number;
      solutions_hashrate: number;
    };
  };
}

interface QubicDataContextType {
  data: QubicToolData | null;
  isLoading: boolean;
  error: Error | null;
}

const QubicDataContext = createContext<QubicDataContextType>({
  data: null,
  isLoading: true,
  error: null,
});

export function QubicDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<QubicToolData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const toolData = await QubicAPI.getToolData();

        if (!mounted) return;

        if (!toolData || !toolData.data) {
          throw new Error('Invalid tool data');
        }

        // 确保价格和汇率是有效的数字
        const price = typeof toolData.data.price === 'string' ? 
          parseFloat(toolData.data.price) : 
          (typeof toolData.data.price === 'number' ? toolData.data.price : 0);

        const cny = typeof toolData.data.CNY === 'string' ? 
          parseFloat(toolData.data.CNY) : 
          (typeof toolData.data.CNY === 'number' ? toolData.data.CNY : 0);

        const transformedData: QubicToolData = {
          networkHashRate: toolData.data.pool_hashrate?.average?.average_minerlab_hashrate ?? 0,
          averageHashrate: toolData.data.pool_hashrate?.average?.average_qli_hashrate ?? 0,
          averageApoolHashrate: toolData.data.pool_hashrate?.average?.average_apool_hashrate ?? 0,
          averageMinerlabHashrate: toolData.data.pool_hashrate?.average?.average_minerlab_hashrate ?? 0,
          averageNevermineHashrate: toolData.data.pool_hashrate?.average?.average_nevermine_hashrate ?? 0,
          averageSolutionsHashrate: toolData.data.pool_hashrate?.average?.average_solutions_hashrate ?? 0,
          solutionsPerHour: toolData.data.solutionsPerHour ?? 0,
          solutionsPerHourCalculated: toolData.data.solutionsPerHourCalculated ?? 0,
          price,
          currentEpoch: toolData.data.currentEpoch ?? 0,
          totalBlocks: toolData.data.total_solutions ?? 0,
          idle: toolData.data.idle ?? false,
          CNY: cny,
          proposal: toolData.data.proposal,
          apoolStats: {
            accepted_solution: toolData.data.apool?.accepted_solution ?? 0,
            corrected_hashrate: toolData.data.apool?.corrected_hashrate ?? 0,
            pool_hash: toolData.data.apool?.pool_hash ?? 0,
            shares_per_solution: toolData.data.apool?.shares_per_solution ?? 0,
            total_share: toolData.data.apool?.total_share ?? 0,
          },
          minerlabStats: {
            accepted_solution: toolData.data.minerlab?.accepted_solution ?? 0,
            corrected_hashrate: toolData.data.minerlab?.corrected_hashrate ?? 0,
            pool_hash: toolData.data.minerlab?.pool_hash ?? 0,
          },
          nevermineStats: {
            accepted_solution: toolData.data.nevermine?.accepted_solution ?? 0,
            corrected_hashrate: toolData.data.nevermine?.corrected_hashrate ?? 0,
            pool_hash: toolData.data.nevermine?.pool_hash ?? 0,
            shares_per_solution: toolData.data.nevermine?.shares_per_solution ?? 0,
            total_share: toolData.data.nevermine?.total_share ?? 0,
          },
          solutionsStats: {
            accepted_solution: toolData.data.solutions?.accepted_solution ?? 0,
            corrected_hashrate: toolData.data.solutions?.corrected_hashrate ?? 0,
            pool_hash: toolData.data.solutions?.pool_hash ?? 0,
            shares_per_solution: toolData.data.solutions?.shares_per_solution ?? 0,
            total_share: toolData.data.solutions?.total_share ?? 0,
            pplns_solutions: toolData.data.solutions?.pplns_solutions ?? 0,
            solo_solutions: toolData.data.solutions?.solo_solutions ?? 0,
          },
          poolHashrate: {
            average: {
              average_apool_hashrate: toolData.data.pool_hashrate?.average?.average_apool_hashrate ?? 0,
              average_minerlab_hashrate: toolData.data.pool_hashrate?.average?.average_minerlab_hashrate ?? 0,
              average_nevermine_hashrate: toolData.data.pool_hashrate?.average?.average_nevermine_hashrate ?? 0,
              average_qli_hashrate: toolData.data.pool_hashrate?.average?.average_qli_hashrate ?? 0,
              average_solutions_hashrate: toolData.data.pool_hashrate?.average?.average_solutions_hashrate ?? 0,
              record_count: toolData.data.pool_hashrate?.average?.record_count ?? 0,
            },
            current: {
              apool_hashrate: toolData.data.pool_hashrate?.current?.apool_hashrate ?? 0,
              minerlab_hashrate: toolData.data.pool_hashrate?.current?.minerlab_hashrate ?? 0,
              nevermine_hashrate: toolData.data.pool_hashrate?.current?.nevermine_hashrate ?? 0,
              qli_hashrate: toolData.data.pool_hashrate?.current?.qli_hashrate ?? 0,
              solutions_hashrate: toolData.data.pool_hashrate?.current?.solutions_hashrate ?? 0,
            },
          },
        };

        setData(transformedData);
        setError(null);
        setRetryCount(0);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching tool data:', error);
        setError(error instanceof Error ? error : new Error('Unknown error'));
        
        if (retryCount < maxRetries) {
          retryTimeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchData();
          }, Math.pow(2, retryCount) * 1000);
        } else {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 minutes

    return () => {
      mounted = false;
      clearInterval(interval);
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryCount]);

  return (
    <QubicDataContext.Provider value={{ data, isLoading, error }}>
      {children}
    </QubicDataContext.Provider>
  );
}

export function useQubicData() {
  const context = useContext(QubicDataContext);
  if (context === undefined) {
    throw new Error('useQubicData must be used within a QubicDataProvider');
  }
  return context;
}
