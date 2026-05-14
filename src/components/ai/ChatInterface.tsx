import React, { useRef, useEffect, useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useAIChat } from "@/hooks/useAIChat";
import { TOOLS } from "@/config/tools.registry";
import ToolCard from "@/components/ui/ToolCard";
import { Button } from "@/components/ui/Button";
import {
  AlertTriangle,
  RotateCcw,
  Zap,
  ChevronLeft,
  Cpu,
  History,
  Loader2,
  Menu,
  MessageSquare,
  MoreVertical,
  Plus,
  Send,
  ShieldAlert,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { DEFAULT_WEBLLM_MODEL_ID, LIGHTWEIGHT_WEBLLM_MODEL_ID } from "@/hooks/useWebLLM";
import { cn } from "@/lib/utils";
import { m, AnimatePresence } from "framer-motion";
import { Markdown } from "@/components/ui/Markdown";
import Image from "next/image";


interface ChatInterfaceProps {
  modelName?: string;
  onClose?: () => void;
  onSetupRequired?: () => void;
}

export function ChatInterface({ onClose }: ChatInterfaceProps) {
  const {
    conversations,
    activeId,
    setActiveId,
    createNewConversation,
    addMessageToActive,
    commitActiveConversation,
    deleteConversation,
    activeConversation,
  } = useConversations();

  const { 
    generateResponse, 
    stopGeneration, 
    isGenerating, 
    uninstallModel, 
    isLoaded, 
    isLoading, 
    progressPercentage,
    error,
    loadModel,
    activeModelId
  } = useAIChat();

  const [input, setInput] = useState("");
  const [streamBuffer, setStreamBuffer] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!showHistory && !isGenerating && textareaRef.current && isLoaded) {
      textareaRef.current.focus();
    }
  }, [showHistory, isGenerating, isLoaded]);

  useEffect(() => {
    if (!showHistory) {
      scrollToBottom();
    }
  }, [activeConversation?.messages, streamBuffer, showHistory]);

  useEffect(() => {
    if (conversations.length === 0 && !activeId && !showHistory) {
      createNewConversation();
    }
  }, [conversations.length, activeId, createNewConversation, showHistory]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating || !isLoaded) return;

    let currentActiveId = activeId;
    if (!currentActiveId) {
      currentActiveId = createNewConversation();
    }

    const userMsg = input.trim();
    setInput("");
    setStreamBuffer("");

    addMessageToActive({ role: "user", content: userMsg }, currentActiveId);

    const previousMessages = conversations.find((c) => c.id === currentActiveId)?.messages || [];
    const history = [...previousMessages, { role: "user" as const, content: userMsg }];

    const toolDescriptions = TOOLS.map((t) => `- **${t.name}**: ${t.description}`).join("\n");
    const systemPromptMessage = {
      role: "system" as const,
      content: `
      Your name is **Echo**. You are the official AI assistant for Toolbase, built by developers at Open Build Network (OBN).

---

## WHO YOU ARE
- You assist users with questions about Toolbase, its tools, and OBN.
- You were built by the team at OBN - an open-source organization that builds tools for developers, by the community.
- Useful links:
  - Website: https://openbuildnetwork.com/
  - GitHub: https://github.com/openbuildnetwork/toolbase

---

## AVAILABLE TOOLS
${toolDescriptions}

---

## STRICT RULES - FOLLOW EXACTLY

1. **Only answer questions about Toolbase, its tools, or OBN.** If the question is unrelated, politely decline and redirect the user.

2. **Never make up information.** If you do not know the answer, say: "I don't have that information. Please check the official docs or GitHub."

3. **If the question is vague or ambiguous, ask for clarification before answering.** Do not guess what the user meant. Example: "Could you clarify what you mean by X so I can give you the right answer?"

4. **Stay close to the question.** Answer only what was asked. Do not add unrelated details or expand beyond the scope of the question.

5. **Never discuss your internal architecture, development process, training, or any internal Toolbase implementation details.**

6. **Always bold Tool Names** when referencing them - e.g., **ToolName**.

---

## OUTPUT FORMAT
- Respond in clean **Markdown**.
- Be concise and direct. Avoid filler phrases like "Great question!" or "Certainly!".
- If listing tools or steps, use bullet points or numbered lists.
- Keep answers short unless detail is explicitly requested.
      `,
    };

    const messagesForEngine = [systemPromptMessage, ...history];

    try {
      let fullResponse = "";
      const generatedResponse = await generateResponse(messagesForEngine, (token) => {
        fullResponse += token;
        setStreamBuffer(fullResponse);
      });
      const responseToSave = fullResponse || generatedResponse;

      if (responseToSave.trim()) {
        addMessageToActive({ role: "assistant", content: responseToSave }, currentActiveId);
      }
      setStreamBuffer("");
      commitActiveConversation();
    } catch (err) {
      console.error(err);
      addMessageToActive(
        { role: "assistant", content: "An error occurred during generation. Please try again." },
        currentActiveId,
      );
      commitActiveConversation();
    }
  };

  const handleStop = async () => {
    await stopGeneration();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (showHistory) {
    return (
      <m.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex h-full w-full flex-col bg-(--background)"
      >
        <div className="flex items-center justify-between border-b border-(--border-subtle) bg-(--surface-overlay)/90 px-4 py-3 backdrop-blur-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(false)}
            className="gap-2 rounded-lg border border-(--border-subtle) bg-(--surface-elevated)/70 text-(--text-secondary) hover:bg-(--surface-hover)"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
            <History className="h-4 w-4 text-blue-500" />
            Chat History
          </div>
          <Button
            onClick={() => {
              createNewConversation();
              setShowHistory(false);
            }}
            size="sm"
            className="gap-2 rounded-lg bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="mx-auto max-w-3xl space-y-2">
            {conversations.map((conv) => (
              <m.div
                layout
                key={conv.id}
                className={cn(
                  "group flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-sm transition-all",
                  activeId === conv.id
                    ? "border-blue-500/30 bg-blue-500/10 text-(--text-primary) shadow-sm"
                    : "border-(--border-subtle) bg-(--surface-elevated)/65 text-(--text-secondary) hover:border-blue-500/25 hover:bg-(--surface-hover)",
                )}
                onClick={() => {
                  setActiveId(conv.id);
                  setShowHistory(false);
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      activeId === conv.id ? "bg-blue-500/15 text-blue-500" : "bg-(--surface-hover) text-(--text-muted)",
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{conv.title}</p>
                    <p className="mt-0.5 text-xs text-(--text-muted)">{conv.messages.length} messages</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${conv.title}`}
                  className="h-8 w-8 shrink-0 rounded-lg text-(--text-muted) opacity-0 hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </m.div>
            ))}
            {conversations.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-(--border-medium) bg-(--surface-elevated)/45 p-10 text-center">
                <MessageSquare className="h-8 w-8 text-(--text-faint)" />
                <p className="text-sm font-medium text-(--text-secondary)">No recent conversations yet.</p>
              </div>
            )}
          </div>
        </div>
      </m.div>
    );
  }

  const chatStatus = isLoading && !isLoaded ? "Warming" : isGenerating ? "Responding" : isLoaded ? "Ready" : "Offline";
  const isChatable = isLoaded && !isLoading && !isGenerating;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,var(--surface-overlay)_0%,var(--background)_100%)]">
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(var(--border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--border-subtle)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative z-10 flex items-center justify-between border-b border-(--border-subtle) bg-(--surface-overlay)/86 px-4 py-3 backdrop-blur-xl md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open chat history"
            onClick={() => setShowHistory(true)}
            className="rounded-lg border border-(--border-subtle) bg-(--surface-elevated)/70 text-(--text-secondary) hover:bg-(--surface-hover)"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 shadow-lg shadow-blue-500/10 overflow-hidden border border-blue-500/20">
            <Image 
              src="/assets/images/echo_basic.png" 
              alt="Echo" 
              width={40} 
              height={40} 
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold tracking-tight text-(--text-primary)">Echo</h2>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]",
                  isChatable
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    : isGenerating
                      ? "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
                )}
              >
                {chatStatus}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-(--text-muted)">
              <Cpu className="h-3.5 w-3.5" />
              <span className="truncate">Local private session</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open chat menu"
              className="rounded-lg border border-(--border-subtle) bg-(--surface-elevated)/70 text-(--text-muted) hover:bg-(--surface-hover)"
              onClick={() => setShowMenu((value) => !value)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            <AnimatePresence>
              {showMenu && (
                <m.div
                  initial={{ opacity: 0, scale: 0.97, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-lg border border-(--border-subtle) bg-(--surface-overlay) p-1 shadow-2xl backdrop-blur-xl"
                >
                  <button
                    onClick={() => {
                      if (confirm("Uninstall Local AI Engine? This will clear cached model weights.")) {
                        uninstallModel();
                        setShowMenu(false);
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                      <ShieldAlert className="h-4 w-4" />
                    </span>
                    Uninstall local engine
                  </button>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close chat"
              className="rounded-lg border border-(--border-subtle) bg-(--surface-elevated)/70 text-(--text-muted) hover:bg-(--surface-hover)"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 scrollbar-thin md:px-6">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col">
          {!activeConversation?.messages.length ? (
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-1 flex-col items-center justify-center text-center"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 shadow-xl shadow-blue-500/10 overflow-hidden border border-blue-500/20">
                <Image 
                  src="/assets/images/echo_basic.png" 
                  alt="Echo" 
                  width={64} 
                  height={64} 
                  className="h-full w-full object-cover p-1"
                />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-(--text-primary)">What can Echo help with?</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-(--text-muted)">
                Ask about Toolbase tools, OBN, workflows, or which utility fits the job. Your chat runs locally.
              </p>
              <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-3">
                {["Find the right tool", "Explain a workflow", "Compare tool options"].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="rounded-lg border border-(--border-subtle) bg-(--surface-elevated)/70 px-3 py-3 text-sm font-medium text-(--text-secondary) transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-(--text-primary)"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </m.div>
          ) : (
            <div className="space-y-5">
              <AnimatePresence initial={false}>
                {activeConversation.messages.map((msg, idx) => {
                  let matchedTools: typeof TOOLS = [];
                  if (msg.role === "assistant") {
                    matchedTools = TOOLS.filter(
                      (t) =>
                        msg.content.toLowerCase().includes(t.name.toLowerCase()) ||
                        msg.content.toLowerCase().includes(`/${t.route.toLowerCase()}`),
                    );
                  }

                  return (
                    <m.div
                      initial={{ opacity: 0, y: 10, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      key={idx}
                      className={cn("flex w-full gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {msg.role === "assistant" && (
                        <div className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 shadow-sm overflow-hidden border border-blue-500/20 sm:flex">
                          <Image 
                            src="/assets/images/echo_basic.png" 
                            alt="Echo" 
                            width={32} 
                            height={32} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}

                      <div className={cn("flex max-w-[88%] flex-col gap-2", msg.role === "user" ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "px-4 py-3 text-[15px] leading-relaxed shadow-sm",
                            msg.role === "user"
                              ? "rounded-2xl rounded-tr-md bg-blue-600 text-white shadow-blue-500/20"
                              : "rounded-2xl rounded-tl-md border border-(--border-subtle) bg-(--surface-elevated)/86 text-(--text-primary)",
                          )}
                        >
                          {msg.role === "user" ? (
                            <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                          ) : (
                            <Markdown content={msg.content} />
                          )}
                        </div>

                        {matchedTools.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-3">
                            {matchedTools.map((t) => (
                              <m.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={t.id}
                                className="w-40 overflow-hidden rounded-lg border border-(--border-subtle) shadow-lg transition-colors hover:border-blue-500/40"
                              >
                                <ToolCard
                                  title={t.name}
                                  route={`/${t.route}`}
                                  icon={t.thumbnail}
                                  toolId={t.id}
                                  metadata={t.tags}
                                />
                              </m.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </m.div>
                  );
                })}

                {streamBuffer && (
                  <m.div
                    initial={{ opacity: 0, y: 10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex w-full justify-start gap-3"
                  >
                    <div className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 shadow-sm overflow-hidden border border-blue-500/20 sm:flex">
                      <Image 
                        src="/assets/images/echo_basic.png" 
                        alt="Echo" 
                        width={32} 
                        height={32} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-(--border-subtle) bg-(--surface-elevated)/86 px-4 py-3 text-[15px] leading-relaxed shadow-sm">
                      <Markdown content={streamBuffer} />
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {(isGenerating || (isLoading && !isLoaded)) && !streamBuffer && (
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 flex justify-start gap-3">
              <div className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 shadow-sm overflow-hidden border border-blue-500/20 sm:flex">
                <Image 
                  src="/assets/images/echo_basic.png" 
                  alt="Echo" 
                  width={32} 
                  height={32} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="rounded-2xl rounded-tl-md border border-(--border-subtle) bg-(--surface-elevated)/86 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-500">
                    {isLoading && !isLoaded ? `Warming engine (${progressPercentage}%)` : "Echo is thinking"}
                  </span>
                </div>
              </div>
            </m.div>
          )}
          {error && (
            <m.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">Engine Crash</h3>
                    <p className="mt-1 text-sm leading-relaxed text-(--text-primary)">
                      {error}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      onClick={() => loadModel(activeModelId || DEFAULT_WEBLLM_MODEL_ID)}
                      className="gap-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </Button>
                    
                    {activeModelId !== LIGHTWEIGHT_WEBLLM_MODEL_ID && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => loadModel(LIGHTWEIGHT_WEBLLM_MODEL_ID)}
                        className="gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                      >
                        <Zap className="h-4 w-4" />
                        Switch to Lightweight
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </m.div>
          )}

          <div ref={messagesEndRef} className="pb-4" />
        </div>
      </div>

      <div className="relative z-10 border-t border-(--border-subtle) bg-(--surface-overlay)/90 p-3 backdrop-blur-xl md:p-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[28px] border border-(--border-subtle) bg-(--surface-elevated)/95 p-2 shadow-[0_16px_50px_var(--shadow-color)] ring-1 ring-white/40 transition focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 dark:ring-white/5">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoaded ? "Ask Echo about Toolbase..." : "Warming up local AI..."}
                className="max-h-[180px] min-h-12 flex-1 resize-none bg-transparent px-4 py-3 text-[15px] leading-6 text-(--text-primary) outline-none placeholder:text-(--text-muted) disabled:opacity-50"
                rows={1}
                disabled={isGenerating || !isLoaded}
              />
              {isGenerating ? (
                <Button
                  onClick={handleStop}
                  aria-label="Stop response"
                  className="mb-1 h-11 w-11 rounded-2xl bg-(--text-primary) p-0 text-(--background) shadow-md hover:scale-[1.02] hover:opacity-90"
                >
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || !isLoaded}
                  aria-label="Send message"
                  className={cn(
                    "mb-1 h-11 w-11 rounded-2xl p-0 shadow-lg transition-all",
                    input.trim() && isLoaded
                      ? "bg-blue-600 text-white shadow-blue-500/25 hover:scale-[1.02] hover:bg-blue-500"
                      : "bg-(--surface-hover) text-(--text-muted) opacity-60",
                  )}
                >
                  <Send className="h-[18px] w-[18px]" />
                </Button>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium text-(--text-faint)">
            <span>Echo v1.0.0 Beta</span>
            <span className="h-1 w-1 rounded-full bg-(--text-faint)" />
            <span>Enter to send</span>
            <span className="h-1 w-1 rounded-full bg-(--text-faint)" />
            <span>Shift + Enter for a new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
