"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ProgressState = {
  progress: number;
  stage: string;
};

type WorkerMessage =
  | { type: "progress"; id: string; progress: number; stage: string }
  | { type: "result"; id: string; result: unknown }
  | { type: "error"; id: string; error: string };

type Pending = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

export function useArchiveKitWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, Pending>>(new Map());
  const [isBusy, setBusy] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({ progress: 0, stage: "idle" });

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL("../workers/archive-kit.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type === "progress") {
        setProgress({ progress: msg.progress, stage: msg.stage });
        return;
      }
      const pending = pendingRef.current.get(msg.id);
      if (!pending) return;
      pendingRef.current.delete(msg.id);
      if (msg.type === "result") {
        setBusy(false);
        setProgress({ progress: 100, stage: "done" });
        pending.resolve(msg.result);
        return;
      }
      setBusy(false);
      setProgress({ progress: 0, stage: "idle" });
      pending.reject(new Error(msg.error));
    };
    workerRef.current = worker;
    return worker;
  }, []);

  const run = useCallback(
    <T>(action: string, payload: unknown): Promise<T> => {
      const worker = ensureWorker();
      const id = crypto.randomUUID();
      setBusy(true);
      setProgress({ progress: 1, stage: "queued" });
      return new Promise<T>((resolve, reject) => {
        pendingRef.current.set(id, { resolve: resolve as (value: unknown) => void, reject });
        worker.postMessage({ id, action, payload });
      });
    },
    [ensureWorker]
  );

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    pendingRef.current.forEach(({ reject }) => reject(new Error("Operation cancelled.")));
    pendingRef.current.clear();
    setBusy(false);
    setProgress({ progress: 0, stage: "cancelled" });
  }, []);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return { run, cancel, isBusy, progress };
}
