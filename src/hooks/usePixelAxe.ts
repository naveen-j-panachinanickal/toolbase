
import { useCallback, useEffect, useRef, useState } from 'react';

interface CompressorState {
    isReady: boolean;
    isProcessing: boolean;
    error: string | null;
}

interface WorkerMessage {
    type: 'READY' | 'RESULT' | 'ERROR';
    data?: any;
    error?: string;
    id?: string;
}

export function usePixelAxe() {
    const [state, setState] = useState<CompressorState>({
        isReady: false,
        isProcessing: false,
        error: null,
    });

    const workerRef = useRef<Worker | null>(null);
    const pendingRequests = useRef<Map<string, { resolve: (value: any) => void, reject: (reason?: any) => void }>>(new Map());

    useEffect(() => {
        // Initialize worker
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('../workers/pixel-axe.worker', import.meta.url));
            
            workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
                const { type, data, error, id } = event.data;

                if (type === 'READY') {
                    setState(prev => ({ ...prev, isReady: true }));
                } else if (type === 'RESULT' && id) {
                    const request = pendingRequests.current.get(id);
                    if (request) {
                        request.resolve(data);
                        pendingRequests.current.delete(id);
                    }
                    setState(prev => ({ ...prev, isProcessing: false }));
                } else if (type === 'ERROR' && id) {
                    const request = pendingRequests.current.get(id);
                    if (request) {
                        request.reject(new Error(error));
                        pendingRequests.current.delete(id);
                    }
                    setState(prev => ({ ...prev, isProcessing: false, error: error || 'Verification failed' }));
                }
            };
            
             // Preload
             workerRef.current.postMessage({ type: 'INIT' });
        }

        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    const execute = useCallback(async (action: string, data: any) => {
        if (!workerRef.current || !state.isReady) {
            throw new Error("Worker not ready");
        }

        setState(prev => ({ ...prev, isProcessing: true, error: null }));
        const id = Math.random().toString(36).substring(7);

        return new Promise((resolve, reject) => {
            pendingRequests.current.set(id, { resolve, reject });
            workerRef.current?.postMessage({ type: 'EXECUTE', action, data, id });
        });
    }, [state.isReady]);

    const compressImage = useCallback(async (file: File, options: { 
        quality: number, 
        format: string, 
        resizeFactor: number,
        enhance: boolean,
        denoise?: boolean,
        vibrant?: boolean, 
        print_dpi?: boolean
    }) => {
        const buffer = await file.arrayBuffer();
        const data = {
            image_data: new Uint8Array(buffer),
            quality: options.quality,
            format: options.format,
            resize_factor: options.resizeFactor,
            enhance: options.enhance,
            denoise: options.denoise,
            vibrant: options.vibrant,
            print_dpi: options.print_dpi
        };
        return execute('compress', data);
    }, [execute]);

    const getImageInfo = useCallback(async (file: File) => {
        const buffer = await file.arrayBuffer();
        return execute('get_info', { image_data: new Uint8Array(buffer) });
    }, [execute]);

    const resizeImage = useCallback(async (file: File, options: {
        width: number,
        height: number,
        quality: number,
        format: string,
        mode?: 'stretch' | 'contain',
        fill_color?: string
    }) => {
        const buffer = await file.arrayBuffer();
        const data = {
            image_data: new Uint8Array(buffer),
            width: options.width,
            height: options.height,
            quality: options.quality,
            format: options.format,
            mode: options.mode,
            fill_color: options.fill_color
        };
        return execute('resize', data);
    }, [execute]);

    const hideText = useCallback(async (file: File, text: string) => {
        const buffer = await file.arrayBuffer();
        const data = {
            image_data: new Uint8Array(buffer),
            text: text,
        };
        // Returns the PNG bytes with hidden text
        return execute('hide_text', data);
    }, [execute]);

    const revealText = useCallback(async (file: File) => {
        const buffer = await file.arrayBuffer();
        const data = {
            image_data: new Uint8Array(buffer),
        };
        // Returns the extracted string
        return execute('reveal_text', data);
    }, [execute]);

    return {
        ...state,
        compressImage,
        getImageInfo,
        resizeImage,
        hideText,
        revealText
    };
}
