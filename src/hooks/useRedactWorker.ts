import { useState, useEffect, useCallback } from 'react';
import { RedactRequest, RedactResponse } from '@/types/redact';

export type RedactEngineLabel = 'Rust WASM' | 'Unavailable';

import { redactSecretsWorker } from '@/workers/instances';

export function useRedactWorker() {
    const [isReady, setIsReady] = useState(redactSecretsWorker.readyState === 'ready');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [engineLabel, setEngineLabel] = useState<RedactEngineLabel>(
        redactSecretsWorker.readyState === 'ready' ? 'Rust WASM' : 'Unavailable'
    );

    useEffect(() => {
        const handleReadyStateChange = (state: string, message?: string) => {
            setIsReady(state === 'ready');
            setEngineLabel(state === 'ready' ? 'Rust WASM' : 'Unavailable');
            if (state === 'cold' && message) {
                setError(message);
            }
        };

        redactSecretsWorker.onReadyStateChange = handleReadyStateChange;
        
        // Trigger initialization
        redactSecretsWorker.init().catch(err => {
            console.error('Failed to init redact secrets worker:', err);
        });

        // Initial sync
        handleReadyStateChange(redactSecretsWorker.readyState);

        return () => {
            if (redactSecretsWorker.onReadyStateChange === handleReadyStateChange) {
                redactSecretsWorker.onReadyStateChange = undefined;
            }
        };
    }, []);

    const redact = useCallback(async (request: RedactRequest): Promise<RedactResponse> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await redactSecretsWorker.execute('redact', request as any);
            return result as RedactResponse;
        } catch (err: any) {
            const msg = err.message || 'Redaction failed';
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { redact, isReady, isLoading, error, engineLabel };
}
