import { useState, useEffect, useCallback } from "react";
import { checkOllamaRunning, hasModel } from "@/lib/ollama";

export type OllamaState = {
  isLoading: boolean;
  isOllamaRunning: boolean;
  isModelInstalled: boolean;
  error: Error | null;
};

export function useOllama(modelName: string = "phi3:mini") {
  const [state, setState] = useState<OllamaState>({
    isLoading: true,
    isOllamaRunning: false,
    isModelInstalled: false,
    error: null,
  });

  const checkStatus = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const running = await checkOllamaRunning();

      if (!running) {
        setState({
          isLoading: false,
          isOllamaRunning: false,
          isModelInstalled: false,
          error: null,
        });
        return;
      }

      const installed = await hasModel(modelName);

      setState({
        isLoading: false,
        isOllamaRunning: true,
        isModelInstalled: installed,
        error: null,
      });
    } catch (err) {
      setState({
        isLoading: false,
        isOllamaRunning: false,
        isModelInstalled: false,
        error: err instanceof Error ? err : new Error("Unknown error"),
      });
    }
  }, [modelName]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    ...state,
    checkStatus,
  };
}
