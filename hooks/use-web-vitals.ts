"use client";

import { useEffect } from 'react';
import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';
import { sendToAnalytics } from '@/lib/vitals';

const useWebVitals = () => {
  useEffect(() => {
    // Core Web Vitals
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onLCP(sendToAnalytics);
    // Other Web Vitals
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }, []);
};

export default useWebVitals;
