import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Upload, FileCheck, X, FileText, Eye } from 'lucide-react';
import { getTypeColor } from './ToolNode';
import { PdfPreview } from '../../../ui/PdfPreview';

/**
 * FileInputNode — The pipeline starting node where a user drops/selects their file.
 *
 * Uses useReactFlow().updateNodeData() directly — no callback prop needed,
 * so there is no race condition with the parent's effect-based wiring.
 */
export function FileInputNode({ id, data }: { id: string; data: any }) {
    const { updateNodeData } = useReactFlow();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (data.file && data.file.type.startsWith('image/')) {
            const url = URL.createObjectURL(data.file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewUrl(null);
    }, [data.file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        updateNodeData(id, { file });
        // Also call the parent callback if provided (e.g. for pipeline engine)
        data.onFileSelect?.(file);
    };

    const handleRemove = () => {
        updateNodeData(id, { file: null });
        data.onFileSelect?.(null);
    };

    const contentType = data.file?.type || 'application/octet-stream';
    const status = data.status || 'idle';

    const borderColor = status === 'running'
        ? 'rgba(74,222,128,0.7)'
        : status === 'complete'
            ? 'rgba(74,222,128,0.5)'
            : data.file
                ? 'rgba(74,222,128,0.35)'
                : 'rgba(255,255,255,0.07)';

    const glowColor = (status === 'running' || status === 'complete' || data.file)
        ? 'rgba(74,222,128,0.15), 0 8px 32px rgba(0,0,0,0.4)'
        : 'rgba(0,0,0,0.4)';

    return (
        <div style={{
            width: 220,
            background: 'linear-gradient(145deg, #0d1a12 0%, #0a1210 100%)',
            border: `1.5px solid ${borderColor}`,
            borderRadius: 14,
            padding: '12px',
            boxShadow: `0 0 20px ${glowColor}`,
            transition: 'all 0.25s ease',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'rgba(74,222,128,0.12)',
                    border: '1px solid rgba(74,222,128,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {data.file
                        ? <FileCheck style={{ width: 15, height: 15, color: '#4ade80' }} />
                        : <Upload style={{ width: 15, height: 15, color: '#4ade80' }} />
                    }
                </div>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.02em' }}>
                        File Input
                    </div>
                    <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Starting Point
                    </div>
                </div>
            </div>

            {/* Drop zone or file preview */}
            {!data.file ? (
                <label
                    className="nopan nodrag"
                    onMouseDown={e => e.stopPropagation()}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        border: '1px dashed rgba(74,222,128,0.25)',
                        borderRadius: 10,
                        padding: '18px 10px',
                        cursor: 'pointer',
                        background: 'rgba(74,222,128,0.04)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Upload style={{ width: 20, height: 20, color: 'rgba(74,222,128,0.5)' }} />
                    <span style={{ fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 1.4 }}>
                        Click to select file
                    </span>
                    <input
                        type="file"
                        className="nopan nodrag"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </label>
            ) : (
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 9,
                    padding: '8px 10px',
                }}>
                    {/* Preview Image / Icon */}
                    <div
                        className="group"
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: 100,
                            borderRadius: 6,
                            overflow: 'hidden',
                            marginBottom: 8,
                            background: '#000',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        {previewUrl ? (
                             <img
                                src={previewUrl}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : data.file?.type === 'application/pdf' ? (
                            <PdfPreview
                                file={data.file}
                                scale={0.4}
                                className="w-full h-full opacity-60"
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255,255,255,0.02)',
                            }}>
                                <FileText style={{ width: 18, height: 18, color: '#444' }} />
                            </div>
                        )}

                        {/* View Overlay */}
                        <div
                            className="nopan nodrag opacity-0 group-hover:opacity-100"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'opacity 0.2s ease',
                                cursor: 'pointer',
                            }}
                            onMouseDown={e => e.stopPropagation()}
                            onClick={() => data.onPreview?.(data.file)}
                        >
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: '#34d399', color: '#000', padding: '4px 10px',
                                borderRadius: 6, fontSize: 10, fontWeight: 700
                            }}>
                                <Eye style={{ width: 12, height: 12 }} />
                                PREVIEW
                            </div>
                        </div>
                    </div>

                    <div style={{
                        fontSize: 11.5,
                        color: '#e5e7eb',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 5,
                    }}>
                        {data.file.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, color: '#666' }}>
                                {(data.file.size / 1024).toFixed(1)} KB
                            </span>
                            <span style={{
                                fontSize: 9,
                                color: getTypeColor(contentType),
                                background: `${getTypeColor(contentType)}18`,
                                border: `1px solid ${getTypeColor(contentType)}30`,
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                            }}>
                                {contentType.split('/')[1] || 'BIN'}
                            </span>
                        </div>
                        <button
                            className="nopan nodrag"
                            onMouseDown={e => e.stopPropagation()}
                            onClick={handleRemove}
                            style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 5,
                                padding: '2px 5px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center',
                            }}
                        >
                            <X style={{ width: 11, height: 11, color: '#f87171' }} />
                        </button>
                    </div>
                </div>
            )}

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    background: data.file ? getTypeColor(contentType) : '#4ade80',
                    width: 11, height: 11,
                    border: '2px solid #0a1210',
                    boxShadow: '0 0 6px rgba(74,222,128,0.5)',
                }}
            />
        </div>
    );
}
