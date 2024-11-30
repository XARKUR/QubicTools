"use client";

import { QuerySettingsCard } from './query-settings-card';
import { QueryResultsCard } from './query-results-card';
import { useState } from 'react';
import { QueryResult } from '@/types/query-result';

/**
 * 批量余额查询表单组件
 * 
 * 这是批量余额查询功能的主入口组件，它集成了：
 * - QuerySettingsCard：用于配置查询参数和输入地址
 * - QueryResultsCard：用于展示查询结果
 * 
 * 组件内部维护查询结果的状态，并通过 props 在子组件间传递数据。
 * 
 * @component
 * @example
 * ```tsx
 * // 在页面中使用
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
    // 可以在这里处理地址变化
    console.log('Addresses changed:', value);
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      // TODO: 可以添加一个成功提示
      console.log('Address copied:', address);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleDeleteResult = (id: number) => {
    setResults(prevResults => prevResults.filter(result => result.id !== id));
  };
  
  return (
    <div className="flex flex-col gap-4">
      <QuerySettingsCard 
        onAddressesChange={handleAddressesChange}
        onSearch={() => {
          setIsLoading(true);
          // TODO: 实现查询逻辑
          setIsLoading(false);
        }}
        onResults={setResults}
        isLoading={isLoading}
      />
      <QueryResultsCard 
        results={results}
        onCopyAddress={handleCopyAddress}
        onDeleteResult={handleDeleteResult}
      />
    </div>
  );
}

export { BatchBalanceForm as BatchBalance }
