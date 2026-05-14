import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Download, PackageCheck, Sparkles, FileText, Eye } from 'lucide-react';

/**
 * OutputNode — The pipeline terminal node that shows results and allows file download.
 */
export function OutputNode({ data }: { data: any }) {
    const bundle = data.bundle;
    const status = data.status || 'idle';
    const [resultPreviews, setResultPreviews] = useState<{ url: string; payload: any }[]>([]);

    useEffect(() => {
        if (bundle && bundle.payloads && bundle.payloads.length > 0) {
            const results = bundle.payloads
                .filter((p: any) => p.meta.contentType?.startsWith('image/'))
                .slice(0, 3)
                .map((p: any) => ({
                    url: URL.createObjectURL(p.data),
                    payload: p
                }));
            setResultPreviews(results);
            return () => results.forEach((r: any) => URL.revokeObjectURL(r.url));
        }
        setResultPreviews([]);
    }, [bundle]);

    const isComplete = status === 'complete' && !!bundle;

    const handleDownload = () => {
        if (!bundle) return;
        bundle.payloads.forEach((payload: any, i: number) => {
            setTimeout(() => {
                const url = URL.createObjectURL(payload.data);
                const a = document.createElement('a');
                a.href = url;
                a.download = payload.meta.filename || `output-${i}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }, i * 200);
        });
    };

    return (
        <div style={{
            width: 220,
            background: isComplete
                ? 'linear-gradient(145deg, #0d1f19 0%, #0a1814 100%)'
                : 'linear-gradient(145deg, #121212 0%, #0d0d0d 100%)',
            border: `1.5px solid ${isComplete ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 14,
            padding: '12px',
            boxShadow: isComplete
                ? '0 0 24px rgba(52,211,153,0.15), 0 8px 32px rgba(0,0,0,0.4)'
                : '0 8px 32px rgba(0,0,0,0.4)',
            transition: 'all 0.3s ease',
        }}>
            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    background: '#34d399',
                    width: 11, height: 11,
                    border: '2px solid #0a1814',
                    boxShadow: '0 0 6px rgba(52,211,153,0.4)',
                }}
            />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: isComplete ? 'rgba(52,211,153,0.15)' : 'rgba(52,211,153,0.07)',
                    border: `1px solid ${isComplete ? 'rgba(52,211,153,0.3)' : 'rgba(52,211,153,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {isComplete
                        ? <Sparkles style={{ width: 14, height: 14, color: '#34d399' }} />
                        : <PackageCheck style={{ width: 15, height: 15, color: '#34d399' }} />
                    }
                </div>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.02em' }}>
                        Pipeline Output
                    </div>
                    <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Terminal Node
                    </div>
                </div>
            </div>

            {/* Content */}
            {isComplete ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Result Previews */}
                    {resultPreviews.length > 0 && (
                        <div style={{
                            display: 'flex',
                            gap: 6,
                            marginBottom: 4,
                            height: 44,
                        }}>
                            {resultPreviews.map((item, i) => (
                                <div 
                                    key={i} 
                                    className="group"
                                    style={{
                                        position: 'relative',
                                        flex: 1,
                                        borderRadius: 6,
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: '#000',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => data.onPreview?.(item.payload)}
                                >
                                    <img src={item.url} alt={`Result ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    
                                    {/* Preview Overlay */}
                                    <div className="opacity-0 group-hover:opacity-100" style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0,0,0,0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'opacity 0.2s ease',
                                    }}>
                                        <Eye style={{ width: 12, height: 12, color: '#34d399' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    <div style={{
                        background: 'rgba(52,211,153,0.06)',
                        border: '1px solid rgba(52,211,153,0.12)',
                        borderRadius: 9,
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 5,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#666' }}>Files</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#d1fae5', fontFamily: 'monospace' }}>
                                {bundle.meta.count}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#666' }}>Size</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#d1fae5', fontFamily: 'monospace' }}>
                                {(bundle.meta.totalSizeBytes / 1024).toFixed(1)} KB
                            </span>
                        </div>
                        {data.totalDurationMs !== undefined && (
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderTop: '1px solid rgba(52,211,153,0.1)', paddingTop: 5, marginTop: 2,
                            }}>
                                <span style={{ fontSize: 10, color: '#666' }}>Duration</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
                                    {(data.totalDurationMs / 1000).toFixed(2)}s
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Download button */}
                    <button
                        onClick={handleDownload}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            width: '100%',
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                            border: 'none',
                            borderRadius: 9,
                            padding: '9px',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            letterSpacing: '0.02em',
                            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <Download style={{ width: 13, height: 13 }} />
                        Download Results
                    </button>
                </div>
            ) : status === 'running' ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '24px 10px',
                    border: '1px dashed rgba(52,211,153,0.2)',
                    borderRadius: 9,
                    background: 'rgba(52,211,153,0.03)',
                }}>
                    <Sparkles style={{ width: 22, height: 22, color: '#34d399', opacity: 0.6 }} />
                    <span style={{ fontSize: 10.5, color: '#34d399', textAlign: 'center', fontWeight: 500 }}>
                        Synthesizing results...
                    </span>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '20px 10px',
                    border: '1px dashed rgba(255,255,255,0.06)',
                    borderRadius: 9,
                }}>
                    <PackageCheck style={{ width: 22, height: 22, color: 'rgba(52,211,153,0.25)' }} />
                    <span style={{ fontSize: 10.5, color: '#444', textAlign: 'center', lineHeight: 1.5 }}>
                        Awaiting pipeline execution...
                    </span>
                </div>
            )}
        </div>
    );
}
