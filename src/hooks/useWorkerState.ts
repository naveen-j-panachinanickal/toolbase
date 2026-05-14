import { useEffect, useState } from 'react';
import { workerForTool } from '@/workers/instances';
import type { WorkerReadyState } from '@/workers/client';

/**
 * useWorkerState — Subscribes to the WorkerClient readyState for a given tool.
 * Useful for showing "warming up runtime…" indicators while WASM boots.
 */
export function useWorkerState(toolId: string) {
    const worker = workerForTool(toolId);

    const [readyState, setReadyState] = useState<WorkerReadyState>(() => worker?.readyState ?? 'ready');
    const [warmMessage, setWarmMessage] = useState('');

    useEffect(() => {
        if (!worker) {
            setReadyState('ready');
            return;
        }

        // Sync immediately
        setReadyState(worker.readyState);

        const prevCallback = worker.onReadyStateChange;
        worker.onReadyStateChange = (state, message) => {
            setReadyState(state);
            setWarmMessage(message ?? '');
            prevCallback?.(state, message);
        };

        return () => {
            if (worker.onReadyStateChange !== prevCallback) {
                worker.onReadyStateChange = prevCallback;
            }
        };
    }, [worker]);

    return { readyState, warmMessage };
}
