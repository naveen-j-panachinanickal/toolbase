'use client';

import React from 'react';
import { m } from 'framer-motion';
import { Workflow, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

import clsx from 'clsx';

interface TryPipelineButtonProps {
  className?: string;
}

export function TryPipelineButton({ className }: TryPipelineButtonProps) {
  return (
    <Link href="/pipeline" className={clsx("hidden md:block", className)}>
      <m.button
        whileHover="hover"
        whileTap={{ scale: 0.96 }}
        className={clsx(
          "group relative h-[56px] p-[1.5px] flex items-center justify-center rounded-2xl font-bold transition-all duration-500 cursor-pointer overflow-hidden whitespace-nowrap w-full",
        )}
      >
        {/* 1. The Rotating Border Beam (Background layer) */}
        <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
           <m.div
             className="absolute top-1/2 left-1/2 w-[250%] aspect-square -translate-x-1/2 -translate-y-1/2"
             style={{
               background: 'conic-gradient(from 0deg, transparent, var(--primary), transparent 20%, transparent)',
             }}
             animate={{ rotate: [0, 360] }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
           />
        </div>

        {/* 2. The Glass Surface (The Button Body) */}
        <div 
          className="relative z-10 w-full h-full flex items-center gap-4 px-6 rounded-[calc(1rem-1.5px)] backdrop-blur-2xl border border-black/15 dark:border-white/10 transition-all duration-500 group-hover:bg-primary/[0.05]"
          style={{
            background: 'var(--surface-overlay)',
          }}
        >
          {/* Animated Data Particles (Flowing through the pipeline) */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-10 group-hover:opacity-30 transition-opacity duration-500">
            {[...Array(4)].map((_, i) => (
              <m.div
                key={i}
                className="absolute h-px w-12 bg-gradient-to-r from-transparent via-primary to-transparent"
                initial={{ x: '-150%', y: `${25 + i * 15}%` }}
                animate={{ x: '250%' }}
                transition={{
                  duration: 2.5 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "linear"
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-center w-full gap-3.5">
            <m.div
              variants={{
                hover: { 
                  rotate: [0, -10, 10, 0], 
                  scale: 1.05,
                  boxShadow: '0 0 20px rgba(43, 140, 238, 0.4)'
                }
              }}
              className="flex items-center justify-center w-[34px] h-[34px] rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm shrink-0"
            >
              <Workflow size={18} className="text-current" />
            </m.div>

            <div className="flex flex-col items-start -space-y-0.5 flex-1 min-w-0">
               <div className="flex items-center gap-1">
                 <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary opacity-60 group-hover:opacity-100 transition-opacity">Beta</span>
                 <Sparkles size={9} className="text-primary/40 group-hover:text-primary transition-colors" />
               </div>
               <span className="text-[15px] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-(--text-primary) to-(--text-secondary) group-hover:from-primary group-hover:to-blue-400 transition-all duration-300 truncate">
                 Try Pipeline
               </span>
            </div>

            <m.div
              variants={{
                hover: { x: 3, opacity: 1 }
              }}
              initial={{ x: 0, opacity: 0.3 }}
              className="text-primary ml-auto shrink-0"
            >
              <ArrowRight size={18} strokeWidth={2.5} />
            </m.div>
          </div>

          {/* Continuous Light Flare Sweep */}
          <m.div 
            className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-25deg] pointer-events-none z-20"
            animate={{ x: ['-200%', '400%'] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
          />
        </div>
      </m.button>
    </Link>
  );
}
