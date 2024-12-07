"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { PatternInputCard } from './pattern-input-card';
import { InfoCard } from './info-card';
import { ResultCard } from './result-card';
import { useTranslation } from 'react-i18next';

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
  
  useEffect(() => {
    const result = pattern ? Math.pow(26, pattern.length) : 0;
    setCurrentDifficulty(result);
  }, [pattern]);

  const status = useMemo(() => {
    if (!pattern) return t('vanityAddress.status.ready');
    if (isPaused && !isGenerating) return t('vanityAddress.status.ready');
    if (isPaused) return t('vanityAddress.status.paused');
    return t('vanityAddress.status.generating');
  }, [pattern, isPaused, isGenerating, t]);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setIsPaused(false);
    setPublicId('');
    setPrivateKey('');
  }, []);

  const handlePause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
  }, []);

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
        generatedCount={0}
        speed={0}
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
