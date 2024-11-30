"use client";

import { WalletSettings } from './wallet-settings';
import { MobileWalletCard } from './mobile-wallet-card';
import { useState } from 'react';
import { type Wallet } from '@/types/wallet';

function BatchWalletForm() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [forceStart, setForceStart] = useState(false);
  const [walletCount, setWalletCount] = useState("");
  
  return (
    <div className="flex flex-col gap-4">
      <WalletSettings 
        forceStart={forceStart}
        walletCount={walletCount}
        onForceStartChange={setForceStart}
        onWalletCountChange={setWalletCount}
        onGenerate={() => {
          setIsGenerating(true);
          // TODO: Implement wallet generation
          setWallets([]);
          setIsGenerating(false);
        }}
      />
      <MobileWalletCard wallets={wallets} isGenerating={isGenerating} />
    </div>
  );
}

export { BatchWalletForm as BatchWallet }
