'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from "@/shared/ui/ThemeProvider";
import { GlobalBackground } from "@/shared/ui/GlobalBackground";
import { DaylightManager } from "@/shared/ui/DaylightManager";
import { AIChatProvider } from "@/shared/hooks/ai/useAIChat";
import { CommandPaletteProvider } from "@/shared/ui/CommandPaletteProvider";
import { GlobalAIOverlay } from "@/shared/ui/ai/GlobalAIOverlay";
import { WorkerPrewarmer } from "./WorkerPrewarmer";

import { LazyMotion, domAnimation } from 'framer-motion';

import { CapabilityProvider } from "./CapabilityProvider";

/**
 * The root provider component for the client-side application.
 * 
 * This component orchestrates the global context tree and initialization 
 * logic for the entire Toolbase platform:
 * - Theme Management (Dark/Light/Auto).
 * - Hardware Capability Detection (WebGPU, WASM Threading).
 * - Worker Prewarming (Lazy-loading critical background assets).
 * - AI Assistant State & Overlay.
 * - Command Palette integration.
 * - Service Worker registration (PWA support).
 * - Framer Motion global config (LazyMotion).
 *
 * @param props - Contains the application children.
 */
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
