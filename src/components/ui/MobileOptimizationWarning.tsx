'use client';

import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Monitor, ArrowRight, Home, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MobileOptimizationWarningProps {
  isOpen: boolean;
  onProceed: () => void;
}

export function MobileOptimizationWarning({ isOpen, onProceed }: MobileOptimizationWarningProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
        >
          <m.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="max-w-md w-full rounded-3xl p-8 text-center shadow-2xl border"
            style={{
              background: 'var(--surface-overlay)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="flex justify-center mb-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(234, 179, 8, 0.1)', color: 'rgb(234, 179, 8)' }}
              >
                <Monitor size={32} />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4 tracking-tight">
              Optimized for Desktop
            </h2>
            
            <p className="text-sm leading-relaxed mb-8 opacity-70" style={{ color: 'var(--text-secondary)' }}>
              This tool features a complex interface designed for precision and large screens. 
              Using it on a mobile device may be difficult or restricted. 
              For the best experience, we recommend using a PC.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onProceed}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer"
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(52, 87, 213, 0.3)',
                }}
              >
                Proceed Anyway
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer border"
                style={{
                  background: 'var(--surface-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <Home size={18} />
                Return to Home
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium opacity-50">
              <AlertCircle size={12} />
              <span>Some features may be disabled on mobile</span>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
