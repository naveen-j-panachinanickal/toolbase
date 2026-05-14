"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useWebLLM, Message } from "./useWebLLM";

/**
 * Global state and methods for the AI Assistant chat.
 */
interface AIChatContextType {
  /** Whether the chat overlay is currently visible. */
  isOpen: boolean;
  /** Opens the chat overlay. */
  openChat: () => void;
  /** Closes the chat overlay. */
  closeChat: () => void;
  /** Toggles the chat overlay visibility. */
  toggleChat: () => void;
  
  // WebLLM Engine State
  /** Loads a specific model into the browser's WebGPU runtime. */
  loadModel: (modelId?: string, background?: boolean) => Promise<void>;
  /** Generates a streaming response from the loaded model. */
  generateResponse: (messages: Message[], onToken?: (token: string) => void) => Promise<string>;
  /** Aborts the current generation. */
  stopGeneration: () => Promise<void>;
  /** Resets the current chat session. */
  resetChat: () => Promise<void>;
  /** Removes the model from the browser cache. */
  uninstallModel: () => Promise<void>;
  /** Human-readable loading progress message. */
  progress: string;
  /** Loading progress percentage (0-100). */
  progressPercentage: number;
  /** Whether the model is fully loaded and ready for inference. */
  isLoaded: boolean;
  /** Whether the model is currently being loaded. */
  isLoading: boolean;
  /** Whether the model files are installed locally. */
  isInstalled: boolean;
  /** Whether the model is currently generating a response. */
  isGenerating: boolean;
  /** Current error message, if any. */
  error: string | null;
  /** The ID of the currently active model. */
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

/**
 * Hook to access the AI Chat context.
 * Must be used within an AIChatProvider.
 * 
 * @returns The AIChat context state and methods.
 */
export function useAIChat() {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error("useAIChat must be used within an AIChatProvider");
  }
  return context;
}
