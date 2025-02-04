"use client";

import { QuerySettingsCard } from './query-settings-card';
import { QueryResultsCard } from './query-results-card';
import { useState } from 'react';
import { QueryResult } from '@/types/query-result';

/**
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * @component
 * @example
 * ```tsx
 * 
 * import BatchBalanceForm from '@/components/features/batch-balance';
 * 
 * export default function Page() {
 *   return (
 *     <div>
 *       <BatchBalanceForm />
 *     </div>
 *   );
 * }
 * ```
 */
export default function BatchBalanceForm() {
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddressesChange = (value: string) => {
    console.log('Addresses changed:', value);
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      console.log('Address copied:', address);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleDeleteResult = (id: number) => {
    setResults(prevResults => prevResults.filter(result => result.id !== id));
  };

  const handleClearAll = () => {
    setResults([]);
  };
  
  return (
    <div className="flex flex-col gap-4">
      <QuerySettingsCard 
        onAddressesChange={handleAddressesChange}
        onSearch={() => {
          setIsLoading(true);
          setIsLoading(false);
        }}
        onResults={setResults}
        isLoading={isLoading}
      />
      <QueryResultsCard 
        results={results}
        onCopyAddress={handleCopyAddress}
        onDeleteResult={handleDeleteResult}
        onClearAll={handleClearAll}
      />
    </div>
  );
}

export { BatchBalanceForm as BatchBalance }
