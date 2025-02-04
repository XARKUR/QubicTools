"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PatternInputCard } from './pattern-input-card';
import { InfoCard } from './info-card';
import { ResultCard } from './result-card';
import { useTranslation } from 'react-i18next';
import { VanityWorkerManager } from '@/lib/worker/vanity-worker-manager';

function VanityAddressForm() {
  const { t } = useTranslation();
  const [pattern, setPattern] = useState('');
  const [patternType, setPatternType] = useState<'prefix' | 'suffix'>('prefix');
  const [cpuUsage, setCpuUsage] = useState(55);
  const [forceStart, setForceStart] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [publicId, setPublicId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [speed, setSpeed] = useState(0);
  
  // 使用 useRef 来存储 worker manager 实例
  const workerManagerRef = useRef<VanityWorkerManager | null>(null);

  // 初始化 worker manager
  useEffect(() => {
    workerManagerRef.current = new VanityWorkerManager();
    
    // 设置事件监听
    const manager = workerManagerRef.current;
    
    manager.on('metrics', (metrics) => {
      setGeneratedCount(metrics.totalAttempts);
      setSpeed(metrics.averageSpeed);
    });
    
    manager.on('success', (result) => {
      setPublicId(result.publicId);
      setPrivateKey(result.privateKey);
      setIsGenerating(false);
      setIsPaused(true);
    });
    
    // 清理函数
    return () => {
      if (manager) {
        manager.cleanup();
        workerManagerRef.current = null;
      }
    };
  }, []);

  // 计算难度
  useEffect(() => {
    const result = pattern ? Math.pow(26, pattern.length) : 0;
    setCurrentDifficulty(result);
  }, [pattern]);

  // 状态文本
  const status = useMemo(() => {
    if (!pattern) return t('vanityAddress.status.ready');
    if (isPaused && !isGenerating) return t('vanityAddress.status.ready');
    if (isPaused) return t('vanityAddress.status.paused');
    return t('vanityAddress.status.generating');
  }, [pattern, isPaused, isGenerating, t]);

  // 开始生成
  const handleGenerate = useCallback(() => {
    if (!workerManagerRef.current) return;
    
    setIsGenerating(true);
    setIsPaused(false);
    setPublicId('');
    setPrivateKey('');
    setGeneratedCount(0);
    setSpeed(0);
    
    workerManagerRef.current.start(pattern, patternType, cpuUsage);
  }, [pattern, patternType, cpuUsage]);

  // 暂停生成
  const handlePause = useCallback(() => {
    if (!workerManagerRef.current) return;
    
    setIsPaused(true);
    workerManagerRef.current.pause();
  }, []);

  // 恢复生成
  const handleResume = useCallback(() => {
    if (!workerManagerRef.current) return;
    
    setIsPaused(false);
    workerManagerRef.current.resume();
  }, []);

  // 更新模式
  const handlePatternChange = useCallback((newPattern: string) => {
    setPattern(newPattern);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PatternInputCard 
        pattern={pattern}
        patternType={patternType}
        cpuUsage={cpuUsage}
        forceStart={forceStart}
        setPattern={handlePatternChange}
        setPatternType={setPatternType}
        setCpuUsage={setCpuUsage}
        setForceStart={setForceStart}
        onGenerate={handleGenerate}
        onPause={handlePause}
        onResume={handleResume}
        isPaused={isPaused}
      />
      <InfoCard 
        difficulty={currentDifficulty}
        generatedCount={generatedCount}
        speed={speed}
        status={status}
      />
      <ResultCard 
        publicId={publicId}
        privateKey={privateKey}
      />
    </div>
  );
}

export { VanityAddressForm as VanityAddress }
