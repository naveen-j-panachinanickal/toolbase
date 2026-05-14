"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAIChat } from "@/hooks/useAIChat";
import { cn } from "@/lib/utils";
import { DEFAULT_WEBLLM_MODEL_ID } from "@/hooks/useWebLLM";

const ChatInterface = dynamic(() => import("@/components/ai/ChatInterface").then(mod => mod.ChatInterface), {
  loading: () => <div className="flex h-full w-full items-center justify-center">Loading Chat...</div>
});

const OllamaSetup = dynamic(() => import("@/components/ai/OllamaSetup").then(mod => mod.OllamaSetup), {
  loading: () => <div className="flex h-full w-full items-center justify-center">Loading Setup...</div>
});

export function GlobalAIOverlay() {
  const { isOpen, closeChat, isLoaded, isInstalled } = useAIChat();
  const [hasOpened, setHasOpened] = useState(false);
  const targetModel = DEFAULT_WEBLLM_MODEL_ID;

  // Record if chat has ever been opened to keep it in DOM for transitions
  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/10 backdrop-blur-sm transition-opacity"
          onClick={closeChat}
        />
      )}

      <div 
        className={cn(
          "fixed inset-y-0 right-0 z-[110] flex h-[100dvh] w-full flex-col border-l border-(--border-subtle) bg-(--background) text-(--text-primary) shadow-2xl transition-transform duration-300 sm:w-[450px]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex-1 overflow-hidden">
          {hasOpened && (
            (!isLoaded && !isInstalled) ? (
              <div className="flex h-full w-full items-center p-4 py-8">
                <div className="w-full">
                  <OllamaSetup targetModel={targetModel} onReady={() => {}} onClose={closeChat} />
                </div>
              </div>
            ) : (
              <ChatInterface 
                onClose={closeChat} 
                onSetupRequired={() => {}} 
              />
            )
          )}
        </div>
      </div>
    </>
  );
}
