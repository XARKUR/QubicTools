"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { AppSidebar } from "@/components/layout/navigation/sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { useTranslation } from "react-i18next"
import { SponsorDialog } from "@/components/features/shared/sponsor-dialog"
import { PatternInputCard } from "@/components/features/vanity-address/pattern-input-card"
import { InfoCard } from "@/components/features/vanity-address/info-card"
import { ResultCard } from "@/components/features/vanity-address/result-card"

export default function VanityAddressPage() {
  const { t } = useTranslation()
  const [pattern, setPattern] = useState('')
  const [patternType, setPatternType] = useState<'prefix' | 'suffix'>('prefix')
  const [cpuUsage, setCpuUsage] = useState(55)
  const [forceStart, setForceStart] = useState(false)
  const [isPaused, setIsPaused] = useState(true)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [generatedAddress, setGeneratedAddress] = useState<{ publicId: string; privateKey: string } | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [speed, setSpeed] = useState(0)
  const [difficulty, setDifficulty] = useState(0)
  const [status, setStatus] = useState(t('vanityAddress.status.waiting'))
  const [showSponsorDialog, setShowSponsorDialog] = useState(false)

  const workerStates = useRef<{
    [key: number]: {
      attempts: number;
      speed: number;
      averageSpeed: number;
      lastUpdate: number;
      batchSize: number;
    }
  }>({});

  const performanceMonitor = useRef({
    startTime: 0,
    totalAttempts: 0,
    currentSpeed: 0,
    averageSpeed: 0,
    speedHistory: [] as number[],
    lastUpdate: Date.now(),
    
    reset() {
      this.startTime = Date.now();
      this.totalAttempts = 0;
      this.currentSpeed = 0;
      this.averageSpeed = 0;
      this.speedHistory = [];
      this.lastUpdate = Date.now();
    },
    
    updateMetrics(workerUpdates: typeof workerStates.current) {
      const now = Date.now();
      const duration = now - this.lastUpdate;
      
      if (duration < 500) return; 
      
      let totalSpeed = 0;
      let totalAttempts = 0;
      let activeWorkers = 0;
      
      Object.values(workerUpdates).forEach(worker => {
        if (now - worker.lastUpdate < 1000) { 
          totalSpeed += worker.speed;
          totalAttempts += worker.attempts;
          activeWorkers++;
        }
      });
      
      if (activeWorkers > 0) {
        this.currentSpeed = Math.round(totalSpeed);
        this.totalAttempts = totalAttempts;
        this.speedHistory.push(this.currentSpeed);
        
        if (this.speedHistory.length > 10) {
          this.speedHistory.shift();
        }
        
        this.averageSpeed = Math.round(
          this.speedHistory.reduce((a, b) => a + b, 0) / 
          this.speedHistory.length
        );
      }
      
      this.lastUpdate = now;
      return {
        totalAttempts: this.totalAttempts,
        currentSpeed: this.currentSpeed,
        averageSpeed: this.averageSpeed
      };
    }
  });

  const MAX_WORKERS = useMemo(() => {
    const cores = navigator.hardwareConcurrency || 4;
    return Math.max(1, Math.floor(cores * 0.8));
  }, []);

  const workersRef = useRef<Worker[]>([]);

  const calculateDifficulty = useCallback((pattern: string): number => {
    if (!pattern) return 0;
    const length = pattern.length;
    return Math.pow(26, length);
  }, []);

  useEffect(() => {
    const newDifficulty = calculateDifficulty(pattern);
    setDifficulty(newDifficulty);
  }, [pattern, calculateDifficulty]);

  const updateWorkerState = useCallback((workerId: number, data: any) => {
    const now = Date.now();
    
    workerStates.current[workerId] = {
      attempts: data.attempts,
      speed: data.speed,
      averageSpeed: data.averageSpeed,
      lastUpdate: now,
      batchSize: data.batchSize
    };
    
    const metrics = performanceMonitor.current.updateMetrics(workerStates.current);
    if (metrics) {
      setTotalAttempts(metrics.totalAttempts);
      setSpeed(metrics.currentSpeed);
    }
  }, []);

  useEffect(() => {
    if (!isPaused && startTime) {
      const intervalId = setInterval(() => {
        const metrics = performanceMonitor.current.updateMetrics(workerStates.current);
        if (metrics) {
          setTotalAttempts(metrics.totalAttempts);
          setSpeed(metrics.currentSpeed);
        }
      }, 500);

      return () => clearInterval(intervalId);
    }
  }, [isPaused, startTime]);

  const cleanup = useCallback(() => {
    workersRef.current.forEach(worker => {
      worker.postMessage({ action: 'stop' });
      worker.terminate();
    });
    workersRef.current = [];
    workerStates.current = {};
  }, []);

  const handleGenerate = useCallback(() => {
    if (!pattern) return;
    
    cleanup();
    setIsPaused(false);
    setStatus(t('vanityAddress.status.generating'));
    setStartTime(Date.now());
    setTotalAttempts(0);
    setSpeed(0);
    setGeneratedAddress(null);
    
    performanceMonitor.current.reset();
    workerStates.current = {};
    setDifficulty(calculateDifficulty(pattern));

    for (let i = 0; i < MAX_WORKERS; i++) {
      const worker = new Worker(
        new URL('@/workers/vanity.worker.ts', import.meta.url)
      );

      worker.onmessage = (event) => {
        const { type, data, error } = event.data;

        if (type === 'success') {
          updateWorkerState(data.workerId, data);
          setStatus(t('vanityAddress.status.completed'));
          setIsPaused(true);
          cleanup();
          
          setGeneratedAddress({
            publicId: data.publicId,
            privateKey: data.privateKey
          });
        } else if (type === 'progress') {
          updateWorkerState(data.workerId, data);
        } else if (type === 'error') {
          console.error('Worker error:', error);
          setStatus(t('vanityAddress.status.error'));
          setIsPaused(true);
        }
      };

      workersRef.current.push(worker);
      worker.postMessage({
        action: 'start',
        pattern,
        type: patternType,
        id: i,
        cpuUsage
      });
    }
  }, [pattern, patternType, cpuUsage, MAX_WORKERS, calculateDifficulty, cleanup, updateWorkerState, t]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    setStatus(t('vanityAddress.status.paused'));
    cleanup();
  }, [cleanup, t]);

  const handleResume = useCallback(() => {
    if (!pattern) return;
    
    setIsPaused(false);
    setStatus(t('vanityAddress.status.generating'));
    
    for (let i = 0; i < MAX_WORKERS; i++) {
      const worker = new Worker(
        new URL('@/workers/vanity.worker.ts', import.meta.url)
      );

      worker.onmessage = (event) => {
        const { type, data, error } = event.data;

        if (type === 'success') {
          updateWorkerState(data.workerId, data);
          setStatus(t('vanityAddress.status.completed'));
          setIsPaused(true);
          cleanup();
          
          setGeneratedAddress({
            publicId: data.publicId,
            privateKey: data.privateKey
          });
        } else if (type === 'progress') {
          updateWorkerState(data.workerId, data);
        } else if (type === 'error') {
          console.error('Worker error:', error);
          setStatus(t('vanityAddress.status.error'));
          setIsPaused(true);
        }
      };

      workersRef.current.push(worker);
      worker.postMessage({
        action: 'start',
        pattern,
        type: patternType,
        id: i,
        cpuUsage
      });
    }
  }, [pattern, patternType, cpuUsage, MAX_WORKERS, cleanup, updateWorkerState, t]);

  const handlePatternChange = useCallback((newPattern: string) => {
    setPattern(newPattern);
  }, []);

  useEffect(() => {
    if (generatedAddress) {
      setShowSponsorDialog(true)
    }
  }, [generatedAddress])

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader title={t('vanityAddress.title')} />
        <div className="flex flex-col gap-4 px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8 lg:px-12 lg:pb-12">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
            <div className="w-full min-w-0">
              <PatternInputCard
                pattern={pattern}
                setPattern={handlePatternChange}
                patternType={patternType}
                setPatternType={setPatternType}
                cpuUsage={cpuUsage}
                setCpuUsage={setCpuUsage}
                forceStart={forceStart}
                setForceStart={setForceStart}
                onGenerate={handleGenerate}
                onResume={handleResume}
                onPause={handlePause}
                isPaused={isPaused}
              />
            </div>
            <div className="w-full min-w-0">
              <div className="grid gap-4">
                <InfoCard
                  difficulty={difficulty}
                  generatedCount={totalAttempts}
                  speed={speed}
                  status={status}
                  duration={startTime ? Date.now() - startTime : 0}
                  isPaused={isPaused}
                />
              </div>
            </div>
          </div>
          <div>
            {generatedAddress && (
              <ResultCard
                publicId={generatedAddress.publicId}
                privateKey={generatedAddress.privateKey}
              />
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          {/* 其他内容 */}
          <SponsorDialog 
            open={showSponsorDialog} 
            onOpenChange={setShowSponsorDialog}
            title={t('sponsor.success.title')}
            description={t('sponsor.success.description')}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}