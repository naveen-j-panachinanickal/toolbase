import { useState, useCallback, useRef } from 'react';
import type { TIPTool, TIPConfig, TIPBundle } from '@/tip';
import { TIPToolRegistry } from '@/tip/registry';
import { createBundle, createPayload } from '@/tip/bundle';

/**
 * useTIPTool — The Universal Tool Runner Hook
 * 
 * This hook is used by Standalone UI component pages (e.g. /tools/pixels)
 * to execute the exact same tool pipeline logic that the Builder Engine runs.
 * 
 * It abstracts away the complexity of building a TIPBundle, reporting progress,
 * handling aborts, and returning a final Blob or File output.
 */
export function useTIPTool(toolId: string) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Provide the ability to cancel an ongoing execution
    const abortControllerRef = useRef<AbortController | null>(null);

    const tool = TIPToolRegistry.get(toolId);

    const execute = useCallback(async (
        files: File[],
        config: TIPConfig,
        options: {
            outputNamePrefix?: string,
            onSuccess?: (results: File[]) => void,
            onError?: (err: Error) => void
        } = {}
    ): Promise<File[] | null> => {
        if (!tool) {
            const err = new Error(`Tool not found in registry: ${toolId}`);
            setError(err.message);
            if (options.onError) options.onError(err);
            return null;
        }

        // Guard against oversized inputs to prevent tab crashes
        const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB per file
        const MAX_TOTAL_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB total
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        const hugeFile = files.find(f => f.size > MAX_FILE_SIZE);
        if (hugeFile) {
            const err = new Error(`"${hugeFile.name}" is too large (${(hugeFile.size / 1024 / 1024).toFixed(0)} MB). Maximum file size is 500 MB.`);
            setError(err.message);
            if (options.onError) options.onError(err);
            return null;
        }
        if (totalSize > MAX_TOTAL_SIZE) {
            const err = new Error(`Total input size exceeds 2 GB. Please split your files into smaller batches.`);
            setError(err.message);
            if (options.onError) options.onError(err);
            return null;
        }

        setIsProcessing(true);
        setError(null);
        setProgress(0);
        setProgressMessage('Preparing...');

        // Setup Cancellation
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            // 1. Wrap raw UI files into a strict TIPBundle
            const payloads = files.map(f => {
                // Heuristic: attempt to assign correct MIME, default to octet-stream
                const mime = f.type || 'application/octet-stream';
                return createPayload(f, mime as any, f.name);
            });

            // Use the first file's type as the bundle type, or octet-stream if empty
            const dominantType = payloads.length > 0 ? payloads[0].contentType : 'application/octet-stream';
            const inputBundle = createBundle(payloads, dominantType);

            // 2. Setup the Hooks expected by the tool definition
            const toolHooks = {
                onProgress: (percent: number, msg?: string) => {
                    setProgress(percent);
                    if (msg) setProgressMessage(msg);
                },
                onLog: (msg: string, level: 'error' | 'info' | 'warn') => {
                    if (level === 'error') console.error(`[${tool.name}]`, msg);
                    else if (level === 'warn') console.warn(`[${tool.name}]`, msg);
                    else console.log(`[${tool.name}]`, msg);
                },
                signal: abortControllerRef.current.signal
            };

            // 3. Execute the standard `tip` folder protocol definition
            const outputBundle = await tool.invoke(inputBundle, config, toolHooks);

            // 4. Unwrap the TIPBundle back into a standard array of Files for the React UI to display
            const outputFiles = outputBundle.payloads.map(p => {
                const name = options.outputNamePrefix
                    ? `${options.outputNamePrefix}-${p.meta.filename}`
                    : p.meta.filename;
                
                return new File([p.data], name, { type: p.contentType });
            });

            setProgress(100);
            setProgressMessage('Done');

            if (options.onSuccess) options.onSuccess(outputFiles);
            return outputFiles;

        } catch (err: any) {
             if (abortControllerRef.current?.signal.aborted) {
                console.log('Task aborted block');
                const cancelMsg = "Operation cancelled";
                setError(cancelMsg);
                if (options.onError) options.onError(new Error(cancelMsg));
                return null;
            }

            console.error('useTIPTool execute error:', err);
            setError(err.message || 'An unknown error occurred');
            if (options.onError) options.onError(err);
            return null;
        } finally {
            setIsProcessing(false);
            abortControllerRef.current = null;
        }
    }, [tool]);

    const cancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setProgressMessage('Cancelling...');
        }
    }, []);

    return {
        isProcessing,
        progress,
        progressMessage,
        error,
        tool,
        execute,
        cancel
    };
}
