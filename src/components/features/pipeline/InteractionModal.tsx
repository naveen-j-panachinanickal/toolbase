'use client';
/**
 * InteractionModal — Full-canvas overlay for the Interactive Node Protocol (INP).
 *
 * Renders a tool's interaction component (e.g. MergePdfInteraction) inside a
 * dark frosted-glass overlay that covers the entire pipeline canvas.
 *
 * Any TIP tool with `interactable: true` gets this modal automatically — no
 * new modal needs to be written for future interactive tools.
 */
import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import type { TIPTool, TIPInteractionProps, TIPInteractionResult } from '@/tip/protocol';

interface InteractionModalProps {
    /** The tool whose getInteractionComponent() will be rendered */
    tool: TIPTool;
    /** Files to pre-seed the interaction component with (from upstream or prior runs) */
    seedFiles: File[];
    /** Current node config */
    config: Record<string, unknown>;
    /** Called when user confirms — carries ordered files + optional extra config */
    onConfirm: (result: TIPInteractionResult) => void;
    /** Called when user cancels or presses Escape */
    onCancel: () => void;
}

/**
 * InteractionModal
 *
 * Lazy-loads the tool's interaction component, renders it in a full-screen
 * overlay, and passes through INP callbacks.
 */
export function InteractionModal({
    tool,
    seedFiles,
    config,
    onConfirm,
    onCancel,
}: InteractionModalProps) {
    type ComponentType = (props: TIPInteractionProps) => React.ReactNode;
    const [Component, setComponent] = useState<ComponentType | null>(null);
    const [loading, setLoading] = useState(true);

    // Lazy-load the interaction component
    useEffect(() => {
        if (!tool.getInteractionComponent) {
            setLoading(false);
            return;
        }
        tool.getInteractionComponent().then((Comp) => {
            // Wrap in an object so useState doesn't try to call it as an initialiser
            setComponent(() => Comp as ComponentType);
            setLoading(false);
        });
    }, [tool]);

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCancel]);

    return (
        <AnimatePresence>
            <m.div
                key="interaction-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'stretch',
                    justifyContent: 'center',
                    padding: '24px',
                }}
                onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
            >
                <m.div
                    key="interaction-modal-panel"
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    style={{
                        width: '100%',
                        maxWidth: 960,
                        background: '#ffffff',
                        borderRadius: 20,
                        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    {/* Modal header */}
                    <div style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                        background: '#fafafa',
                    }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
                                {tool.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                                Configure and confirm before the pipeline runs this step
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            title="Cancel (Esc)"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, borderRadius: 8,
                                background: 'rgba(0,0,0,0.05)',
                                border: '1px solid rgba(0,0,0,0.08)',
                                cursor: 'pointer',
                            }}
                        >
                            <X style={{ width: 15, height: 15, color: '#555' }} />
                        </button>
                    </div>

                    {/* Modal body — renders the interaction component */}
                    <div style={{
                        flex: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '24px',
                    }}>
                        {loading ? (
                            <div style={{
                                flex: 1, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: 10, color: '#888',
                            }}>
                                <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                                <span style={{ fontSize: 13 }}>Loading editor…</span>
                            </div>
                        ) : Component ? (
                            <Component
                                files={seedFiles}
                                config={config}
                                onConfirm={onConfirm}
                                onCancel={onCancel}
                            />
                        ) : (
                            <div style={{ color: '#ef4444', fontSize: 13 }}>
                                This tool does not have an interaction component.
                            </div>
                        )}
                    </div>
                </m.div>
            </m.div>
        </AnimatePresence>
    );
}
