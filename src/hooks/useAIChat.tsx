"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useWebLLM, Message } from "./useWebLLM";

interface AIChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  // WebLLM Engine State
  loadModel: (modelId?: string, background?: boolean) => Promise<void>;
  generateResponse: (messages: Message[], onToken?: (token: string) => void) => Promise<string>;
  stopGeneration: () => Promise<void>;
  resetChat: () => Promise<void>;
  uninstallModel: () => Promise<void>;
  progress: string;
  progressPercentage: number;
  isLoaded: boolean;
  isLoading: boolean;
  isInstalled: boolean;
  isGenerating: boolean;
  error: string | null;
  activeModelId: string | null;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const webLLM = useWebLLM();

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen((prev) => !prev);

  return (
    <AIChatContext.Provider value={{ 
      isOpen, 
      openChat, 
      closeChat, 
      toggleChat,
      ...webLLM
    }}>
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error("useAIChat must be used within an AIChatProvider");
  }
  return context;
}
