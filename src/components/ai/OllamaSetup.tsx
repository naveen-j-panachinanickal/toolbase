import React, { useEffect } from "react";
import { useAIChat } from "@/hooks/useAIChat";
import { DEFAULT_WEBLLM_MODEL_ID, LIGHTWEIGHT_WEBLLM_MODEL_ID } from "@/hooks/useWebLLM";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Cpu, ShieldCheck, Sparkles, X, AlertTriangle, RotateCcw, Zap } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";

interface OllamaSetupProps {
  onReady?: () => void;
  onClose?: () => void;
  targetModel?: string;
}

export function OllamaSetup({ onReady, onClose, targetModel = DEFAULT_WEBLLM_MODEL_ID }: OllamaSetupProps) {
  const { loadModel, progress, progressPercentage, isLoading, isLoaded, error } = useAIChat();

  useEffect(() => {
    if (isLoaded) {
      onReady?.();
    }
  }, [isLoaded, onReady]);

  return (
    <div className="relative w-full max-w-md mx-auto h-full flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <m.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            <Card className="border-(--border-subtle) bg-(--surface-overlay)/40 backdrop-blur-xl overflow-hidden rounded-[32px] shadow-2xl">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-8">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
                  <div className="relative z-10 w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                     <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
                  </div>
                </div>
                <div className="space-y-4 w-full">
                  <h3 className="text-xl font-bold text-(--text-primary)">Booting Engine</h3>
                  <div className="w-full space-y-4">
                    <div className="h-2 w-full bg-blue-500/10 rounded-full overflow-hidden border border-blue-500/10">
                       <m.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          className="h-full bg-linear-to-r from-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                       />
                    </div>
                    <div className="text-[13px] text-(--text-muted) font-medium font-mono bg-(--background)/50 p-4 rounded-2xl border border-(--border-subtle) break-words leading-relaxed min-h-[80px] flex items-center justify-center">
                      {progress || "Initializing WebGPU resources..."}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-(--text-faint) uppercase tracking-widest font-black">
                     <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                     {progressPercentage > 0 ? `${progressPercentage}% Cached` : "Preparing Model Weights"}
                  </div>
                </div>

                {error && (
                  <m.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full space-y-4 pt-2"
                  >
                    <div className="flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                      <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="h-4 w-4" />
                        Initialization Error
                      </div>
                      <p className="text-xs text-(--text-primary) leading-relaxed">
                        {error}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => loadModel(targetModel)}
                        className="w-full gap-2 rounded-xl bg-red-500 text-white hover:bg-red-600 h-10"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retry Activation
                      </Button>
                      
                      {targetModel !== LIGHTWEIGHT_WEBLLM_MODEL_ID && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => loadModel(LIGHTWEIGHT_WEBLLM_MODEL_ID)}
                          className="w-full gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 h-10"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Try Lightweight Model
                        </Button>
                      )}
                    </div>
                  </m.div>
                )}
              </CardContent>
            </Card>
          </m.div>
        ) : (
          <m.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <Card className="border-(--border-subtle) bg-(--background) rounded-[32px] shadow-2xl overflow-hidden relative border-t-blue-500/30">
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 to-indigo-600 opacity-50" />
              
              {onClose && (
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-(--surface-hover) transition-colors"
                >
                  <X className="h-5 w-5 text-(--text-muted)" />
                </button>
              )}

              <CardHeader className="text-center pb-2 pt-8">
                <div className="mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30">
                    <Cpu className="h-10 w-10" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-black tracking-tight text-(--text-primary)">Private AI</CardTitle>
                <CardDescription className="pt-2 text-[15px] text-(--text-muted) leading-relaxed px-4">
                  Run high-performance language models entirely in your browser using **WebGPU**.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 pt-6 px-8">
                <div className="space-y-4">
                  <div className="flex gap-4 items-start p-4 rounded-2xl bg-(--surface-secondary)/50 border border-(--border-subtle)/50">
                    <ShieldCheck className="h-6 w-6 text-blue-500 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-(--text-primary)">Zero-Server Privacy</p>
                      <p className="text-xs text-(--text-muted) leading-relaxed">
                        Inference stays in RAM/VRAM. No data ever hits a network.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start p-4 rounded-2xl bg-(--surface-secondary)/50 border border-(--border-subtle)/50">
                    <Sparkles className="h-6 w-6 text-indigo-500 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-(--text-primary)">One-Time Setup</p>
                      <p className="text-xs text-(--text-muted) leading-relaxed">
                        We download ~2GB of weights to your persistent browser storage.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <div className="flex justify-between text-[10px] text-(--text-faint) uppercase tracking-widest font-black">
                    <span>Engine</span>
                    <span className="text-blue-500">Phi-3 Mini (4-bit)</span>
                  </div>
                  <div className="h-1.5 w-full bg-(--surface-hover) rounded-full overflow-hidden">
                     <m.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-linear-to-r from-blue-500 to-indigo-500 w-1/3 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                     />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pb-10 pt-6 px-8">
                <Button 
                  onClick={() => loadModel(targetModel)} 
                  className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Activate Assistant
                </Button>
              </CardFooter>
            </Card>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
