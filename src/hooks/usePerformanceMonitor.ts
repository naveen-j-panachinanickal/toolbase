'use client';

/**
 * usePerformanceMonitor
 *
 * Listens for the `toolbase:performance-result` custom event dispatched
 * when a process completes, showing the duration and engine used.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PerformanceResult {
  durationMs: number;
  engine: 'WASM' | 'Python' | 'JS' | string;
  toolId: string;
}

const EVENT_NAME = 'toolbase:performance-result';

export function usePerformanceMonitor() {
  const [result, setResult] = useState<PerformanceResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    setResult(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const handleEvent = (e: any) => {
      const data = e.detail as PerformanceResult;
      
      // Only show if it took > 100ms to avoid noise for instant actions
      if (data.durationMs < 100) return;

      setResult(data);
      
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setResult(null), 4000); // Hide after 4s
    };

    window.addEventListener(EVENT_NAME, handleEvent);
    return () => {
      window.removeEventListener(EVENT_NAME, handleEvent);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { result, clear };
}
