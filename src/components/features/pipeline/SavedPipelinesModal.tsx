import React, { useState } from 'react';
import { X, Trash2, Upload, FileJson, Play } from 'lucide-react';
import type { PipelineDefinition } from '@/types/pipeline';
import { usePipelines } from '@/hooks/usePipelines';

interface SavedPipelinesModalProps {
    onClose: () => void;
    onLoad: (pipeline: PipelineDefinition) => void;
}

export function SavedPipelinesModal({ onClose, onLoad }: SavedPipelinesModalProps) {
    const { pipelines, remove, importJson } = usePipelines();
    const [importError, setImportError] = useState<string | null>(null);

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const result = await importJson(file);
            if (!result.success) {
                setImportError(result.errors.join(', '));
            } else {
                setImportError(null);
            }
        };
        input.click();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            padding: 20
        }}>
            <div style={{
                width: '100%', maxWidth: 500,
                background: '#121214', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                maxHeight: '80vh'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#f3f4f6' }}>Saved Pipelines</h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', padding: 4, borderRadius: 6
                    }}>
                        <X style={{ width: 16, height: 16, color: '#9ca3af' }} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
                    {importError && (
                        <div style={{
                            padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
                            color: '#fca5a5', fontSize: 13, marginBottom: 16
                        }}>
                            {importError}
                        </div>
                    )}

                    {pipelines.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <FileJson style={{ width: 32, height: 32, color: '#555', margin: '0 auto 12px' }} />
                            <div style={{ fontSize: 14, color: '#9ca3af', fontWeight: 500 }}>No saved pipelines yet</div>
                            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Save a pipeline from the builder to see it here</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {pipelines.map(p => (
                                <div key={p.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
                                    transition: 'background 0.2s',
                                }}>
                                    <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                                            {p.steps.length} {p.steps.length === 1 ? 'step' : 'steps'} • Saved {new Date(p.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <button
                                            onClick={() => onLoad(p)}
                                            style={{
                                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                                                color: '#10b981', padding: '6px 12px', borderRadius: 6,
                                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.2)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.1)')}
                                        >
                                            <Play style={{ width: 12, height: 12 }} />
                                            Load
                                        </button>
                                        <button
                                            onClick={() => remove(p.id)}
                                            title="Delete"
                                            style={{
                                                background: 'transparent', border: 'none',
                                                color: '#ef4444', padding: '6px', borderRadius: 6,
                                                cursor: 'pointer', display: 'flex', opacity: 0.7,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.opacity = '1';
                                                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.opacity = '0.7';
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <Trash2 style={{ width: 14, height: 14 }} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', justifyContent: 'center'
                }}>
                    <button
                        onClick={handleImport}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#d1d5db', padding: '8px 16px', borderRadius: 8,
                            fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    >
                        <Upload style={{ width: 14, height: 14 }} />
                        Import JSON
                    </button>
                </div>
            </div>
        </div>
    );
}
