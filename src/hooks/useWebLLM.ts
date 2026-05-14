"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
    MLCEngineInterface,
    InitProgressReport,
    ChatCompletionMessageParam,
} from "@mlc-ai/web-llm";

/**
 * useWebLLM Hook
 *
 * Manages the lifecycle of a WebGPU-powered LLM engine running in a Web Worker.
 * The runtime below is module-scoped on purpose: it keeps the worker, engine,
 * and in-flight load promise alive across React remounts and route changes.
 */

export const DEFAULT_WEBLLM_MODEL_ID = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
export const LIGHTWEIGHT_WEBLLM_MODEL_ID = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC";

export interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

type SharedRuntime = {
    worker: Worker | null;
    engine: MLCEngineInterface | null;
    enginePromise: Promise<MLCEngineInterface> | null;
    modelId: string | null;
    error: string | null;
};

const sharedRuntime: SharedRuntime = {
    worker: null,
    engine: null,
    enginePromise: null,
    modelId: null,
    error: null,
};

function getLoadedModelIds(engineInstance: MLCEngineInterface | null) {
    const maybeWorkerEngine = engineInstance as { modelId?: unknown } | null;
    return Array.isArray(maybeWorkerEngine?.modelId) ? maybeWorkerEngine.modelId : [];
}

function engineHasModel(engineInstance: MLCEngineInterface | null, modelId: string) {
    return getLoadedModelIds(engineInstance).includes(modelId);
}

function isWebLLMAbortError(error: unknown) {
    const errorLike = error as { name?: unknown; message?: unknown };
    const name = typeof errorLike?.name === "string" ? errorLike.name : "";
    const message = typeof errorLike?.message === "string" ? errorLike.message : String(error);

    return (
        name === "AbortError" ||
        message.includes("AbortError") ||
        message.includes("Buffer was unmapped before mapping was resolved") ||
        (message.includes("mapAsync") && message.includes("unmapped"))
    );
}

function isWebLLMDeviceLostError(error: unknown) {
    const message = String(error).toLowerCase();
    return (
        message.includes("device was lost") ||
        message.includes("gpudevicelostinfo") ||
        message.includes("device_hung") ||
        message.includes("out of memory") ||
        message.includes("vram")
    );
}

function isWebLLMModelNotLoadedError(error: unknown) {
    const errorLike = error as { name?: unknown; message?: unknown };
    const name = typeof errorLike?.name === "string" ? errorLike.name : "";
    const message = typeof errorLike?.message === "string" ? errorLike.message : String(error);

    return (
        name === "ModelNotLoadedError" ||
        name === "WorkerEngineModelNotLoadedError" ||
        name === "SpecifiedModelNotFoundError" ||
        message.includes("Model not loaded before trying to complete") ||
        message.includes("is not loaded with a model") ||
        message.includes("is not found in loaded models")
    );
}

function getOrCreateWorker() {
    if (typeof window === "undefined") return null;

    if (!sharedRuntime.worker) {
        sharedRuntime.worker = new Worker(
            new URL("../workers/ai.worker.ts", import.meta.url),
            { type: "module" },
        );
    }

    return sharedRuntime.worker;
}

import { getSystemCapabilities, CapabilityReport } from "@/utils/SystemCapabilities";

export function useWebLLM() {
    const [engine, setEngine] = useState<MLCEngineInterface | null>(sharedRuntime.engine);
    const [progress, setProgress] = useState<string>(sharedRuntime.engine && sharedRuntime.modelId ? "Ready" : "");
    const [isLoaded, setIsLoaded] = useState(Boolean(sharedRuntime.engine && sharedRuntime.modelId));
    const [isLoading, setIsLoading] = useState(Boolean(sharedRuntime.enginePromise));
    const [progressPercentage, setProgressPercentage] = useState(sharedRuntime.engine ? 100 : 0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isInstalled, setIsInstalled] = useState(Boolean(sharedRuntime.engine || sharedRuntime.enginePromise));
    const [error, setError] = useState<string | null>(sharedRuntime.error);
    const [capabilities, setCapabilities] = useState<CapabilityReport | null>(null);

    useEffect(() => {
        void getSystemCapabilities().then(setCapabilities);
    }, []);

    const engineRef = useRef<MLCEngineInterface | null>(sharedRuntime.engine);
    const stopRequestedRef = useRef(false);
    const generationDoneRef = useRef<Promise<void> | null>(null);

    const syncLoadedEngine = useCallback((engineInstance: MLCEngineInterface, modelId: string) => {
        sharedRuntime.engine = engineInstance;
        sharedRuntime.modelId = modelId;
        sharedRuntime.error = null;
        engineRef.current = engineInstance;

        setEngine(engineInstance);
        setIsLoaded(true);
        setIsInstalled(true);
        setProgress("Ready");
        setProgressPercentage(100);
        setError(null);

        if (typeof window !== "undefined") {
            localStorage.setItem("obn_ai_installed", "true");
        }
    }, []);

    const reloadEngine = useCallback(async (
        engineInstance: MLCEngineInterface,
        modelId: string,
        background = false,
    ) => {
        setIsLoading(true);
        setIsLoaded(false);
        setIsInstalled(true);
        setError(null);
        sharedRuntime.error = null;
        setProgress(background ? "Restoring local AI from browser cache..." : "Reloading local AI engine...");
        setProgressPercentage(0);

        try {
            await engineInstance.reload(modelId);
            syncLoadedEngine(engineInstance, modelId);
        } catch (error: any) {
            console.error("Failed to reload model:", error);
            sharedRuntime.modelId = null;
            setIsLoaded(false);
            
            const isDeviceLost = isWebLLMDeviceLostError(error);
            const errorMsg = isDeviceLost 
                ? "GPU Device Lost: Your hardware might be struggling. Try closing other tabs or using the lightweight model."
                : "Error: Failed to load model. Ensure your browser supports WebGPU.";
            
            setError(errorMsg);
            sharedRuntime.error = errorMsg;
            setProgress(errorMsg);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [syncLoadedEngine]);

    const loadModel = useCallback(async (modelId = DEFAULT_WEBLLM_MODEL_ID, background = false) => {
        setError(null);
        sharedRuntime.error = null;

        if (sharedRuntime.engine && sharedRuntime.modelId === modelId) {
            if (engineHasModel(sharedRuntime.engine, modelId)) {
                syncLoadedEngine(sharedRuntime.engine, modelId);
            } else {
                await reloadEngine(sharedRuntime.engine, modelId, background);
            }

            return;
        }

        if (sharedRuntime.enginePromise && (!sharedRuntime.modelId || sharedRuntime.modelId === modelId)) {
            setIsLoading(true);
            setProgress(background ? "Restoring local AI from browser cache..." : "Finishing engine startup...");

            try {
                const engineInstance = await sharedRuntime.enginePromise;
                syncLoadedEngine(engineInstance, sharedRuntime.modelId || modelId);
            } catch (error) {
                console.error("Failed to load model:", error);
                const isDeviceLost = isWebLLMDeviceLostError(error);
                const errorMsg = isDeviceLost 
                    ? "GPU Device Lost: Your hardware might be struggling. Try closing other tabs or using the lightweight model."
                    : "Error: Failed to load model. Ensure your browser supports WebGPU.";
                setError(errorMsg);
                sharedRuntime.error = errorMsg;
                setProgress(errorMsg);
            } finally {
                setIsLoading(false);
            }

            return;
        }

        const caps = capabilities || await getSystemCapabilities();
        let useWasmFallback = !caps.webGPU;
        
        // If no WebGPU, we MUST use the lightweight model to prevent hanging the CPU
        const targetModelId = useWasmFallback ? LIGHTWEIGHT_WEBLLM_MODEL_ID : modelId;

        if (useWasmFallback) {
            console.warn("WebGPU not found. Falling back to WASM (CPU) mode. Performance will be limited.");
            setProgress("Starting in Compatibility Mode (CPU)...");
        }

        const worker = getOrCreateWorker();
        if (!worker) return;

        setIsLoading(true);
        setIsLoaded(false);
        if (background) {
            setIsInstalled(true);
        }
        setProgress(background ? "Restoring local AI from browser cache..." : "Initializing WebGPU...");
        setProgressPercentage(0);

        sharedRuntime.modelId = targetModelId;
        
        const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
        
        const enginePromise = CreateWebWorkerMLCEngine(
            worker,
            targetModelId,
            {
                initProgressCallback: (report: InitProgressReport) => {
                    setProgress(report.text);
                    const match = report.text.match(/(\d+)%/);
                    if (match) {
                        setProgressPercentage(parseInt(match[1], 10));
                    } else if (report.text.includes("Finish loading")) {
                        setProgressPercentage(100);
                    }
                },
            },
        );

        sharedRuntime.enginePromise = enginePromise;

        try {
            const engineInstance = await enginePromise;
            syncLoadedEngine(engineInstance, targetModelId);
        } catch (error) {
            console.error("Failed to load model:", error);
            const isDeviceLost = isWebLLMDeviceLostError(error);
            const errorMsg = isDeviceLost 
                ? "GPU Device Lost: Your hardware might be struggling. Try closing other tabs or using the lightweight model."
                : "Error: Failed to load model. Ensure your browser supports WebGPU or try Compatibility Mode.";
            setError(errorMsg);
            sharedRuntime.error = errorMsg;
            setProgress(errorMsg);
            sharedRuntime.modelId = null;
        } finally {
            if (sharedRuntime.enginePromise === enginePromise) {
                sharedRuntime.enginePromise = null;
            }
            setIsLoading(false);
        }
    }, [reloadEngine, syncLoadedEngine]);

    // Removed auto-loading useEffect to prevent blocking initial LCP with AI worker initialization.
    // The engine will now only initialize when loadModel() is explicitly called (e.g., when opening chat).



    const generateResponse = useCallback(async (
        messages: Message[],
        onToken?: (token: string) => void,
    ) => {
        let activeEngine = engineRef.current ?? sharedRuntime.engine ?? engine;
        if (!activeEngine && sharedRuntime.enginePromise) {
            setProgress("Finishing engine startup...");
            activeEngine = await sharedRuntime.enginePromise;
            syncLoadedEngine(activeEngine, sharedRuntime.modelId || DEFAULT_WEBLLM_MODEL_ID);
        }

        if (!activeEngine) {
            throw new Error("Engine not loaded and no background load in progress");
        }

        const activeModelId = sharedRuntime.modelId || DEFAULT_WEBLLM_MODEL_ID;
        if (!engineHasModel(activeEngine, activeModelId)) {
            await reloadEngine(activeEngine, activeModelId, true);
        }

        setIsGenerating(true);
        stopRequestedRef.current = false;
        let resolveGenerationDone!: () => void;
        const generationDone = new Promise<void>((resolve) => {
            resolveGenerationDone = resolve;
        });
        generationDoneRef.current = generationDone;
        let fullText = "";

        const streamCompletion = async () => {
            const completion = await activeEngine.chat.completions.create({
                model: activeModelId,
                messages: messages as ChatCompletionMessageParam[],
                stream: true,
                temperature: 0.7,
                max_tokens: 1024,
                presence_penalty: 0.0,
                frequency_penalty: 0.0,
            });

            for await (const chunk of completion) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (!stopRequestedRef.current && content) {
                    fullText += content;
                    onToken?.(content);
                }
            }

            return fullText;
        };

        try {
            return await streamCompletion();
        } catch (error) {
            if (stopRequestedRef.current || isWebLLMAbortError(error)) {
                return fullText;
            }

            if (!fullText && isWebLLMModelNotLoadedError(error)) {
                await reloadEngine(activeEngine, activeModelId, true);
                return await streamCompletion();
            }

            if (isWebLLMDeviceLostError(error)) {
                const errorMsg = "GPU Device Lost: The engine has crashed. Please refresh or try the lightweight model.";
                setError(errorMsg);
                sharedRuntime.error = errorMsg;
                
                // Reset engine state as it is now unusable
                sharedRuntime.engine = null;
                sharedRuntime.enginePromise = null;
                engineRef.current = null;
                setEngine(null);
                setIsLoaded(false);
            }

            console.error("Inference error:", error);
            throw error;
        } finally {
            setIsGenerating(false);
            stopRequestedRef.current = false;
            if (generationDoneRef.current === generationDone) {
                generationDoneRef.current = null;
            }
            resolveGenerationDone();
        }
    }, [engine, reloadEngine, syncLoadedEngine]);

    const stopGeneration = useCallback(async () => {
        stopRequestedRef.current = true;

        const activeEngine = engineRef.current ?? sharedRuntime.engine;
        if (activeEngine) {
            activeEngine.interruptGenerate();
        }
    }, []);

    const resetChat = useCallback(async () => {
        const activeEngine = engineRef.current ?? sharedRuntime.engine;
        if (activeEngine) {
            await activeEngine.resetChat();
        }
    }, []);

    const uninstallModel = useCallback(async () => {
        const activeEngine = engineRef.current ?? sharedRuntime.engine;
        const generationDone = generationDoneRef.current;

        if (activeEngine) {
            stopRequestedRef.current = true;
            activeEngine.interruptGenerate();
        }

        if (generationDone) {
            await generationDone;
        }

        if (activeEngine) {
            try {
                await activeEngine.unload();
            } catch (e) {
                console.warn("Failed to unload engine (might already be lost):", e);
            }
        }

        sharedRuntime.engine = null;
        sharedRuntime.enginePromise = null;
        sharedRuntime.modelId = null;
        sharedRuntime.error = null;
        engineRef.current = null;

        if (sharedRuntime.worker) {
            sharedRuntime.worker.terminate();
            sharedRuntime.worker = null;
        }

        setEngine(null);
        setIsLoaded(false);
        setIsLoading(false);
        setIsInstalled(false);
        setProgress("");
        setProgressPercentage(0);
        setError(null);

        if (typeof window !== "undefined") {
            localStorage.removeItem("obn_ai_installed");
            try {
                const dbs = await window.indexedDB.databases();
                for (const db of dbs) {
                    if (db.name && (db.name.includes("web-llm") || db.name.includes("mlc"))) {
                        window.indexedDB.deleteDatabase(db.name);
                    }
                }

                if ("caches" in window) {
                    const cacheNames = await caches.keys();
                    for (const name of cacheNames) {
                        if (name.includes("web-llm") || name.includes("mlc")) {
                            await caches.delete(name);
                        }
                    }
                }

                setProgress("Model uninstalled successfully.");
            } catch (e) {
                console.error("Failed to uninstall model:", e);
            }
        }
    }, []);

    return {
        loadModel,
        generateResponse,
        stopGeneration,
        resetChat,
        uninstallModel,
        progress,
        progressPercentage,
        isLoaded,
        isLoading,
        isInstalled,
        isGenerating,
        error,
        capabilities,
        activeModelId: sharedRuntime.modelId,
    };
}
