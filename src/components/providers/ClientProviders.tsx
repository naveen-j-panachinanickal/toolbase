'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from "../ui/ThemeProvider";
import { GlobalBackground } from "../ui/GlobalBackground";
import { DaylightManager } from "../ui/DaylightManager";
import { AIChatProvider } from "@/hooks/useAIChat";
import { CommandPaletteProvider } from "../ui/CommandPaletteProvider";
import { GlobalAIOverlay } from "@/components/ai/GlobalAIOverlay";
import { WorkerPrewarmer } from "./WorkerPrewarmer";

import { LazyMotion, domAnimation } from 'framer-motion';

import { CapabilityProvider } from "./CapabilityProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      // Manual registration check to assist PWA audits
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.error("Service worker registration failed", err);
        });
      });
    }
  }, []);

  return (
    <ThemeProvider>
      <GlobalBackground />
      <DaylightManager />
      <CapabilityProvider>
        <WorkerPrewarmer />
        <LazyMotion features={domAnimation} strict>
          <AIChatProvider>
            {/* Global UI elements that need context */}
            <CommandPaletteProvider />
            {children}
            <GlobalAIOverlay />
          </AIChatProvider>
        </LazyMotion>
      </CapabilityProvider>
    </ThemeProvider>
  );
}
