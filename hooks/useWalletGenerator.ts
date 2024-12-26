import { useState, useCallback, useEffect } from 'react';

export type WalletData = {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  publicId: string;
};

export type WalletGeneratorState = {
  isGenerating: boolean;
  error: string | null;
  wallet: WalletData | null;
};

export const useWalletGenerator = () => {
  const [state, setState] = useState<WalletGeneratorState>({
    isGenerating: false,
    error: null,
    wallet: null,
  });

  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    // Worker is only created on client side
    if (typeof window !== 'undefined') {
      const walletWorker = new Worker(new URL('../workers/wallet.worker.ts', import.meta.url));
      setWorker(walletWorker);

      return () => {
        walletWorker.terminate();
      };
    }
  }, []);

  const generateWallet = useCallback(async (seed: string) => {
    if (!worker) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'WALLET_GENERATED') {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          wallet: e.data.data,
        }));
      } else if (e.data.type === 'ERROR') {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: e.data.error,
        }));
      }
    };

    worker.postMessage({
      type: 'GENERATE_WALLET',
      seed,
    });
  }, [worker]);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      error: null,
      wallet: null,
    });
  }, []);

  return {
    ...state,
    generateWallet,
    reset,
  };
};
