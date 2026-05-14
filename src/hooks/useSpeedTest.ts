import { useState, useRef, useCallback } from 'react';
import { measurePing, measureDownload, measureUpload, SpeedTestResult } from '@/lib/speed-test';

export type TestStage = 'idle' | 'ping' | 'download' | 'upload' | 'complete' | 'error';

export function useSpeedTest() {
    const [status, setStatus] = useState<TestStage>('idle');
    const [results, setResults] = useState<SpeedTestResult>({
        ping: 0,
        download: 0,
        upload: 0,
    });
    const [error, setError] = useState<string | null>(null);

    // To track live progress for large transfers if we implement chunked updates
    // simplified for now to just show final or interim if possible.
    // Our lib measures support onProgress but we need to wire it up.

    // Actually, storing live ephemeral speed for current stage
    const [currentSpeed, setCurrentSpeed] = useState<number>(0);
    const [speedHistory, setSpeedHistory] = useState<number[]>([]);

    const abortControllerRef = useRef<AbortController | null>(null);

    const startTest = useCallback(async () => {
        if (status === 'ping' || status === 'download' || status === 'upload') return;

        setStatus('ping');
        setError(null);
        setResults({ ping: 0, download: 0, upload: 0 });
        setCurrentSpeed(0);
        setSpeedHistory([]);

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            // 1. Ping
            const ping = await measurePing();
            if (signal.aborted) return;
            setResults(prev => ({ ...prev, ping }));

            // 2. Download
            setStatus('download');
            setCurrentSpeed(0);
            const download = await measureDownload(signal, (mbps) => {
                setCurrentSpeed(mbps);
                setSpeedHistory(prev => [...prev.slice(-11), mbps]);
            });
            if (signal.aborted) return;
            setResults(prev => ({ ...prev, download }));
            setCurrentSpeed(0);
            setSpeedHistory([]);

            // 3. Upload
            setStatus('upload');
            const upload = await measureUpload(signal, (mbps) => {
                setCurrentSpeed(mbps);
                setSpeedHistory(prev => [...prev.slice(-11), mbps]);
            });
            if (signal.aborted) return;
            setResults(prev => ({ ...prev, upload }));
            setCurrentSpeed(0);
            setSpeedHistory([]);

            setStatus('complete');
        } catch (e: any) {
            if (signal.aborted) return;
            console.error('Speed test error:', e);
            setError(e.message || 'Test failed');
            setStatus('error');
        }
    }, [status]);

    const stopTest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setStatus('idle');
        setResults({ ping: 0, download: 0, upload: 0 });
        setCurrentSpeed(0);
    }, []);

    return {
        status,
        results,
        currentSpeed,
        error,
        startTest,
        stopTest,
        speedHistory,
    };
}
