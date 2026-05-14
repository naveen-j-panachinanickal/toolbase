import { useState, useEffect, useCallback } from 'react';
import type { Base64Request, Base64Response } from '@/types/base64';
import { base64Worker } from '@/workers/instances';

export interface UseBase64Result {
    process: (request: Base64Request) => Promise<Base64Response>;
    isReady: boolean;
    isProcessing: boolean;
    result: Base64Response | null;
    previewText: string;
    isLargeFile: boolean;
    error: string | null;
    downloadResult: (filename: string) => void;
    reset: () => void;
}

const errorMessage = (error: unknown, fallback: string): string => {
    return error instanceof Error ? error.message : fallback;
};

export function useBase64(): UseBase64Result {
    const [isReady, setIsReady] = useState(base64Worker.readyState === 'ready');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<Base64Response | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const handleReadyStateChange = (state: string, message?: string) => {
            setIsReady(state === 'ready');
            if (state === 'cold' && message) {
                setError(message);
            }
        };

        base64Worker.onReadyStateChange = handleReadyStateChange;
        
        // Initial sync
        setIsReady(base64Worker.readyState === 'ready');
        base64Worker.init().catch((err: unknown) => {
            if (!isMounted) return;
            setError(errorMessage(err, 'Failed to start Base64 worker'));
            setIsReady(false);
        });

        return () => {
            isMounted = false;
            if (base64Worker.onReadyStateChange === handleReadyStateChange) {
                base64Worker.onReadyStateChange = undefined;
            }
        };
    }, []);

    const process = useCallback(async (request: Base64Request): Promise<Base64Response> => {
        setIsProcessing(true);
        setError(null);
        try {
            const res = await base64Worker.execute('process', request as unknown as Record<string, unknown>) as Base64Response;
            setResult(res);
            if (!res.success) {
                setError(res.error || 'Processing failed');
            }
            return res;
        } catch (err: unknown) {
            const msg = errorMessage(err, 'Processing failed');
            setError(msg);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const downloadResult = useCallback(
        (filename: string) => {
            if (!result || !result.success) {
                console.error('No result to download');
                return;
            }

            try {
                let blob: Blob;
                let downloadFilename = filename;

                if (typeof result.result === 'string') {
                    blob = new Blob([result.result], { type: 'text/plain' });
                    if (!downloadFilename.endsWith('.txt')) {
                        downloadFilename += '.txt';
                    }
                } else if (Array.isArray(result.result)) {
                    const uint8Array = new Uint8Array(result.result);
                    blob = new Blob([new Uint8Array(uint8Array)], { type: 'application/octet-stream' });
                    if (!downloadFilename.includes('.')) {
                        downloadFilename += '.bin';
                    }
                } else {
                    setError('Cannot download: Result data is empty.');
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = downloadFilename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 100);
            } catch {
                setError('Failed to download file');
            }
        },
        [result]
    );

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    const isLargeFile = result?.is_large ?? false;
    const previewText = result?.preview ?? (typeof result?.result === 'string' ? result.result : '');

    return {
        process,
        isReady,
        isProcessing,
        result,
        previewText,
        isLargeFile,
        error,
        downloadResult,
        reset,
    };
}
