"use client";

import React from "react";
import Image from "next/image";
import { OllamaSetup } from "@/components/ai/OllamaSetup";
import { ChatInterface } from "@/components/ai/ChatInterface";
import { Cpu, LockKeyhole, Sparkles } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { DEFAULT_WEBLLM_MODEL_ID } from "@/hooks/useWebLLM";

export default function AiChatPage() {
  const { isInstalled, isLoaded } = useAIChat();
  const targetModel = DEFAULT_WEBLLM_MODEL_ID;
  const modelLabel = "Phi-3 Mini";
  const showSetup = !isInstalled && !isLoaded;

  return (
    <div className="min-h-[calc(100vh-88px)] bg-[linear-gradient(180deg,var(--background)_0%,var(--surface-secondary)_100%)]">
      <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl flex-col gap-5 px-4 py-5 md:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-lg border border-(--border-subtle) bg-(--surface-overlay)/80 px-5 py-5 shadow-[0_16px_50px_var(--shadow-color)] backdrop-blur-xl md:px-7">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500/45 to-transparent" />
          <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(var(--border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--border-subtle)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 py-1 pl-1 pr-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
                <div className="h-5 w-5 overflow-hidden rounded-full border border-blue-500/20 bg-blue-500/10 p-0.5">
                  <Image src="/assets/images/echo_basic.png" alt="Echo" width={985} height={922} className="h-full w-full object-cover" priority />
                </div>
                Echo Workspace
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-(--text-primary) md:text-4xl">
                  Local AI Assistant
                </h1>
                <p className="max-w-xl text-sm leading-6 text-(--text-secondary) md:text-base">
                  A private chat workspace for Toolbase guidance, tool discovery, and quick answers from an engine running on this machine.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
              <div className="rounded-lg border border-(--border-subtle) bg-(--surface-elevated)/75 p-3">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <LockKeyhole className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-(--text-primary)">Private by design</p>
                <p className="mt-1 text-xs leading-5 text-(--text-muted)">Messages stay on device.</p>
              </div>
              <div className="rounded-lg border border-(--border-subtle) bg-(--surface-elevated)/75 p-3">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Cpu className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-(--text-primary)">Local model</p>
                <p className="mt-1 text-xs leading-5 text-(--text-muted)">{modelLabel}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="min-h-0 flex-1">
          {showSetup ? (
            <div className="rounded-lg border border-(--border-subtle) bg-(--surface-overlay)/80 p-4 shadow-[0_16px_50px_var(--shadow-color)] backdrop-blur-xl md:p-8">
              <OllamaSetup targetModel={targetModel} />
            </div>
          ) : (
            <div className="h-[calc(100vh-320px)] min-h-[620px] overflow-hidden rounded-lg border border-(--border-subtle) bg-(--surface-overlay)/85 shadow-[0_20px_70px_var(--shadow-color)] backdrop-blur-xl">
              <ChatInterface />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
