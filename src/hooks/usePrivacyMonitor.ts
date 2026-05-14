'use client';

/**
 * usePrivacyMonitor
 *
 * Listens for the `toolbase:processing-complete` custom event dispatched
 * by tool workers/hooks when a local processing job finishes.
 * Drives the "Processed locally ✓" flash animation on PrivacyBadge.
 *
 * Usage — dispatch from any tool hook/worker bridge:
 *   window.dispatchEvent(new CustomEvent('toolbase:processing-complete'));
 *
 * Returns:
 *   justProcessed  — true for 3s after the last processing-complete event
 *   triggerFlash() — manually trigger the flash (useful for testing / instant feedback)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const EVENT_NAME = 'toolbase:processing-complete';
const FLASH_DURATION_MS = 3000;

export interface PrivacyMonitorState {
  justProcessed: boolean;
  triggerFlash: () => void;
}

export function usePrivacyMonitor(): PrivacyMonitorState {
  const [justProcessed, setJustProcessed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerFlash = useCallback(() => {
    setJustProcessed(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setJustProcessed(false), FLASH_DURATION_MS);
  }, []);

  useEffect(() => {
    const handleEvent = () => triggerFlash();
    window.addEventListener(EVENT_NAME, handleEvent);
    return () => {
      window.removeEventListener(EVENT_NAME, handleEvent);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [triggerFlash]);

  return { justProcessed, triggerFlash };
}
