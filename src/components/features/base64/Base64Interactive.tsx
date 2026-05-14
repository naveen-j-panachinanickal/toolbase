'use client';

import React, { useState } from 'react';
import { Binary, CheckCircle } from 'lucide-react';
import { Base64Workspace } from './Base64Workspace';
import { Button } from '@/components/ui/Button';
import type { TIPInteractionProps } from '@/tip/protocol';

/**
 * TIP Interaction Component for Base64 Tool.
 * Provides an interactive UI to configure Base64 encoding/decoding
 * within the pipeline.
 */
export default function Base64Interactive({
    files,
    config,
    onConfirm,
    onCancel,
}: TIPInteractionProps) {
    const [lastResult, setLastResult] = useState<any>(null);

    const handleConfirm = () => {
        if (!lastResult?.success) {
            // If no result yet, just close if they want to keep previous state, 
            // or we could show a warning. Here we allow it if there's original files.
            onCancel();
            return;
        }

        let finalFile: File;
        if (typeof lastResult.result === 'string') {
            const blob = new Blob([lastResult.result], { type: 'text/plain' });
            finalFile = new File([blob], 'base64_result.txt', { type: 'text/plain' });
        } else {
            const uint8 = new Uint8Array(lastResult.result);
            const blob = new Blob([uint8 as any], { type: 'application/octet-stream' });
            finalFile = new File([blob], 'base64_result.bin', { type: 'application/octet-stream' });
        }

        onConfirm({
            files: [finalFile],
            config: {
                operation: lastResult.mode?.includes('encode') ? 'encode' : 'decode',
                urlSafe: lastResult.urlSafe,
                mimeType: lastResult.mimeType,
            },
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden font-display p-8 space-y-8 bg-(--background)">
            <header className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-(--primary) blur-xl opacity-20" />
                        <div className="relative w-12 h-12 rounded-2xl bg-(--primary) flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Binary className="w-7 h-7" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-(--text-primary)">Base64 <span className="text-(--primary)">Studio</span></h2>
                        <p className="text-xs text-(--text-tertiary) font-semibold uppercase tracking-widest mt-1">Refine and Preview Conversion</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 min-h-0 overflow-hidden bg-(--surface-overlay)/40 backdrop-blur-md border border-(--border-subtle) rounded-3xl p-6 shadow-2xl">
                <Base64Workspace
                    initialFile={files?.[0]}
                    initialMode={files?.length ? 'file' : 'text'}
                    initialOperation={config?.operation === 'decode' ? 'decode' : 'encode'}
                    onResultUpdate={setLastResult}
                />
            </div>

            <footer className="flex items-center justify-end gap-4 pt-4 shrink-0">
                <Button variant="ghost" onClick={onCancel} className="h-12 px-8 rounded-xl text-(--text-secondary) hover:text-(--text-primary) font-bold transition-all">
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={!lastResult?.success}
                    className="macos-primary-button h-12 px-12 rounded-xl font-bold shadow-xl shadow-blue-500/20 group"
                >
                    <CheckCircle className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                    Apply & Continue
                </Button>
            </footer>
        </div>
    );
}
