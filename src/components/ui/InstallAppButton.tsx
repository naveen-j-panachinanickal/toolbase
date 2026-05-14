'use client';

import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Download, ArrowRight } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import clsx from 'clsx';

interface InstallAppButtonProps {
  className?: string;
}

/**
 * Premium "Pill" Install Button for the Header.
 * Hidden on mobile view, features high-end animations and adaptive design.
 */
export function InstallAppButton({ className }: InstallAppButtonProps) {
  // Force show in development so you can see the UI immediately
  const isDev = process.env.NODE_ENV === 'development';
  const { isInstallable, install } = usePWA(isDev);

  // If not installable, don't show anything
  if (!isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (!success && isDev) {
      alert("PWA installation prompt is not yet ready. In development, this usually takes a few seconds or a page refresh once the service worker is registered.");
    }
  };

  return (
    <AnimatePresence>
      <m.button
        initial={{ opacity: 0, scale: 0.9, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: 20 }}
        whileHover="hover"
        whileTap={{ scale: 0.97 }}
        onClick={handleInstall}
        className={clsx(
          "group relative h-9 flex items-center justify-center rounded-full transition-all duration-500 cursor-pointer overflow-hidden whitespace-nowrap hidden md:flex",
          className
        )}
      >
        {/* 1. Subtle Background Flow Animation */}
        <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
           <m.div
             className="absolute inset-0 bg-gradient-to-r from-primary/5 via-blue-400/15 to-primary/5"
             animate={{ x: ['-100%', '100%'] }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
           />
        </div>

        {/* 2. Glass Base Surface */}
        <div 
          className="relative z-10 w-full h-full flex items-center gap-2.5 px-3 rounded-full border border-[var(--border-subtle)] group-hover:border-primary/40 transition-all duration-500 shadow-sm"
          style={{
            background: 'var(--surface-hover)',
          }}
        >
          {/* Icon with Bounce Animation */}
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
            <m.div
              variants={{
                hover: { y: [0, -1, 0, 1, 0], transition: { duration: 1, repeat: Infinity } }
              }}
            >
              <Download size={13} strokeWidth={3} />
            </m.div>
          </div>

          <div className="flex flex-col items-start leading-none">
             <span className="text-[13px] font-bold tracking-tight text-[var(--text-primary)]">
               Install App
             </span>
          </div>

          {/* Animated Arrow that slides in on hover */}
          <m.div
            variants={{
                hover: { x: 2, opacity: 1 }
            }}
            initial={{ x: -5, opacity: 0 }}
            className="text-primary"
          >
            <ArrowRight size={13} strokeWidth={2.5} />
          </m.div>
        </div>

        {/* 3. Border Glow Sweep */}
        <m.div 
            className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] pointer-events-none z-20"
            animate={{ x: ['-200%', '400%'] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
          />
      </m.button>
    </AnimatePresence>
  );
}
