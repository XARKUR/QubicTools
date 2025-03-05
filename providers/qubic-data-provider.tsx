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
  solutionsPerHour: number;
  correctedSolutionsPerHour: number;
  solutionsPerHourCalculated: number;
  price: number;
  currentEpoch: number;
  totalBlocks: number;
  idle: boolean;
  CNY: number;
  burnedQus: string;
  circulatingSupply: string;
  marketCap: string;
  totalLocked: string;
  estimatedIts: number;
  assets: {
    smart_contract: {
      MLM: {
        issuer: string;
        price: number;
      };
      QEARN: {
        issuer: string;
        price: number;
      };
      QPOOL: {
        issuer: string;
        price: number;
      };
      QTRY: {
        issuer: string;
        price: number;
      };
      QUTIL: {
        issuer: string;
        price: number;
      };
      QVAULT: {
        issuer: string;
        price: number;
      };
      QX: {
        issuer: string;
        price: number;
      };
      RANDOM: {
        issuer: string;
        price: number;
      };
    };
    tokens: {
      CFB: {
        issuer: string;
        price: number;
      };
      QCAP: {
        issuer: string;
        price: number;
      };
      QFT: {
        issuer: string;
        price: number;
      };
      QWALLET: {
        issuer: string;
        price: number;
      };
      VSTB001: {
        issuer: string;
        price: number;
      };
    };
  };
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
    name: string;
    accepted_solution: number;
    corrected_hashrate: number;
    pool_hash: number;
    shares_per_solution: number;
    total_share: number;
  };
  minerlabStats: {
    name: string;
    accepted_solution: number;
    corrected_hashrate: number;
    pool_hash: number;
  };
  nevermineStats: {
    name: string;
    accepted_solution: number;
    corrected_hashrate: number;
    pool_hash: number;
    shares_per_solution: number;
    total_share: number;
  };
  poolHashrate: {
    average: {
      average_apool_hashrate: number;
      average_minerlab_hashrate: number;
      average_nevermine_hashrate: number;
      average_qli_hashrate: number;
      record_count: number;
    };
    current: {
      apool_hashrate: number;
      minerlab_hashrate: number;
      nevermine_hashrate: number;
      qli_hashrate: number;
    };
  };
}

interface QubicDataContextType {
  data: QubicToolData | null;
  isLoading: boolean;
}

const QubicDataContext = createContext<QubicDataContextType>({
  data: null,
  isLoading: true,
});

export function QubicDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<QubicToolData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const toolData = await QubicAPI.getToolData();

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
          averageHashrate: toolData.data.pool_hashrate?.average?.average_minerlab_hashrate ?? 0,
          averageApoolHashrate: toolData.data.pool_hashrate?.average?.average_apool_hashrate ?? 0,
          averageMinerlabHashrate: toolData.data.pool_hashrate?.average?.average_minerlab_hashrate ?? 0,
          averageNevermineHashrate: toolData.data.pool_hashrate?.average?.average_nevermine_hashrate ?? 0,
          solutionsPerHour: toolData.data.solutionsPerHour ?? 0,
          correctedSolutionsPerHour: toolData.data.correctedSolutionsPerHour ?? 0,
          solutionsPerHourCalculated: toolData.data.solutionsPerHourCalculated ?? 0,
          price,
          currentEpoch: toolData.data.currentEpoch ?? 0,
          totalBlocks: toolData.data.total_solutions ?? 0,
          idle: toolData.data.idle ?? false,
          CNY: cny,
          burnedQus: toolData.data.burnedQus ?? "0",
          circulatingSupply: toolData.data.circulatingSupply ?? "0",
          marketCap: toolData.data.marketCap ?? "0",
          totalLocked: toolData.data.totalLocked ?? "0",
          estimatedIts: toolData.data.estimatedIts ?? 0,
          assets: {
            smart_contract: {
              MLM: {
                issuer: toolData.data.assets?.smart_contract?.MLM?.issuer ?? "",
                price: toolData.data.assets?.smart_contract?.MLM?.price ?? 0,
              },
              QEARN: {
                issuer: toolData.data.assets?.smart_contract?.QEARN?.issuer ?? "",
                price: toolData.data.assets?.smart_contract?.QEARN?.price ?? 0,
              },
              QPOOL: {
                issuer: toolData.data.assets?.smart_contract?.QPOOL?.issuer ?? "",
                price: toolData.data.assets?.smart_contract?.QPOOL?.price ?? 0,
              },
              QTRY: {
                issuer: toolData.data.assets?.smart_contract?.QTRY?.issuer ?? "",
                price: toolData.data.assets?.smart_contract?.QTRY?.price ?? 0,
              },
              QUTIL: {
                issuer: toolData.data.assets?.smart_contract?.QUTIL?.issuer ?? "",
                price: toolData.data.assets?.smart_contract?.QUTIL?.price ?? 0,
              },
              QVAULT: {
                issuer: toolData.data.assets?.smart_contract?.QVAULT?.issuer ?? "",
                price: toolData.data.assets?.smart_contract?.QVAULT?.price ?? 0,
              },
              QX: {
                issuer: toolData.data.assets?.smart_contract?.QX?.issuer ?? "",
                price: toolData.data.assets?.smart_contract?.QX?.price ?? 0,
              },
              RANDOM: {
                issuer: toolData.data.assets?.smart_contract?.RANDOM?.issuer ?? "",
                price: toolData.data.assets?.smart_contract?.RANDOM?.price ?? 0,
              },
            },
            tokens: {
              CFB: {
                issuer: toolData.data.assets?.tokens?.CFB?.issuer ?? "",
                price: toolData.data.assets?.tokens?.CFB?.price ?? 0,
              },
              QCAP: {
                issuer: toolData.data.assets?.tokens?.QCAP?.issuer ?? "",
                price: toolData.data.assets?.tokens?.QCAP?.price ?? 0,
              },
              QFT: {
                issuer: toolData.data.assets?.tokens?.QFT?.issuer ?? "",
                price: toolData.data.assets?.tokens?.QFT?.price ?? 0,
              },
              QWALLET: {
                issuer: toolData.data.assets?.tokens?.QWALLET?.issuer ?? "",
                price: toolData.data.assets?.tokens?.QWALLET?.price ?? 0,
              },
              VSTB001: {
                issuer: toolData.data.assets?.tokens?.VSTB001?.issuer ?? "",
                price: toolData.data.assets?.tokens?.VSTB001?.price ?? 0,
              },
            },
          },
          proposal: toolData.data.proposal,
          apoolStats: {
            name: 'Apool',
            accepted_solution: toolData.data.apool?.accepted_solution ?? 0,
            corrected_hashrate: toolData.data.apool?.corrected_hashrate ?? 0,
            pool_hash: toolData.data.apool?.pool_hash ?? 0,
            shares_per_solution: toolData.data.apool?.shares_per_solution ?? 0,
            total_share: toolData.data.apool?.total_share ?? 0,
          },
          minerlabStats: {
            name: 'Minerlab',
            accepted_solution: toolData.data.minerlab?.accepted_solution ?? 0,
            corrected_hashrate: toolData.data.minerlab?.corrected_hashrate ?? 0,
            pool_hash: toolData.data.minerlab?.pool_hash ?? 0,
          },
          nevermineStats: {
            name: 'Nevermine',
            accepted_solution: toolData.data.nevermine?.accepted_solution ?? 0,
            corrected_hashrate: toolData.data.nevermine?.corrected_hashrate ?? 0,
            pool_hash: toolData.data.nevermine?.pool_hash ?? 0,
            shares_per_solution: toolData.data.nevermine?.shares_per_solution ?? 0,
            total_share: toolData.data.nevermine?.total_share ?? 0,
          },
          poolHashrate: toolData.data.pool_hashrate ?? {
            average: {
              average_apool_hashrate: 0,
              average_minerlab_hashrate: 0,
              average_nevermine_hashrate: 0,
              average_qli_hashrate: 0,
              record_count: 0,
            },
            current: {
              apool_hashrate: 0,
              minerlab_hashrate: 0,
              nevermine_hashrate: 0,
              qli_hashrate: 0,
            },
          },
        };

        setData(transformedData);
      } catch (error) {
        console.error('Error fetching tool data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 300000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <QubicDataContext.Provider value={{ data, isLoading }}>
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
