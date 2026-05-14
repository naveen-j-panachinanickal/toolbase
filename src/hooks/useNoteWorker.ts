import { useEffect, useRef, useCallback } from 'react';

export function useNoteWorker() {
  const workerRef = useRef<Worker | null>(null);
  const resolversRef = useRef<{ [key: string]: { resolve: (val: any) => void; reject: (err: any) => void } }>({});

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/note-vault.worker.ts', import.meta.url));
    workerRef.current.onmessage = (e) => {
      const { id, type, payload, error } = e.data;
      if (resolversRef.current[id]) {
        if (type === 'SUCCESS') {
          resolversRef.current[id].resolve(payload);
        } else {
          resolversRef.current[id].reject(new Error(error));
        }
        delete resolversRef.current[id];
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const runTask = useCallback((type: string, payload: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }
      const id = crypto.randomUUID();
      resolversRef.current[id] = { resolve, reject };
      workerRef.current.postMessage({ id, type, payload });
    });
  }, []);

  return { runTask };
}
