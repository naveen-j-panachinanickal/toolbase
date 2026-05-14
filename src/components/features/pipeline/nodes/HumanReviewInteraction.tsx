'use client';

import React, { useState } from 'react';
import { TIPInteractionProps } from '@/tip/protocol';
import { Check, X, FileText, AlertCircle, Eye, Download } from 'lucide-react';
import { PdfPreview } from '@/components/ui/PdfPreview';
import { m, AnimatePresence } from 'framer-motion';

/**
 * HumanReviewInteraction — The UI for the Human Review (Gate) node.
 * 
 * Shows a high-fidelity preview of incoming files and requires
 * the user to Approve or Reject before the pipeline continues.
 */
export default function HumanReviewInteraction({ files, onConfirm, onCancel }: TIPInteractionProps) {
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const activeFile = files[selectedFileIndex];

    const isPdf = activeFile?.type === 'application/pdf';
    const isImage = activeFile?.type.startsWith('image/');

    const handleDownload = () => {
        if (!activeFile) return;
        const url = URL.createObjectURL(activeFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFile.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: 20,
        }}>
            {/* Main Content Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                gap: 24,
                minHeight: 0,
            }}>
                {/* Sidebar: File List */}
                <div style={{
                    width: 260,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    borderRight: '1px solid #f0f0f0',
                    paddingRight: 20,
                    overflowY: 'auto',
                }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 4 }}>
                         {files.length} Incoming {files.length === 1 ? 'File' : 'Files'}
                    </div>
                    {files.map((file, idx) => (
                        <button
                            key={`${file.name}-${idx}`}
                            onClick={() => setSelectedFileIndex(idx)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: '1px solid',
                                borderColor: selectedFileIndex === idx ? '#8b5cf6' : '#f0f0f0',
                                background: selectedFileIndex === idx ? 'rgba(139,92,246,0.05)' : '#fff',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <div style={{ 
                                width: 32, height: 32, borderRadius: 8, 
                                background: selectedFileIndex === idx ? '#8b5cf615' : '#f8f8f8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <FileText style={{ width: 16, height: 16, color: selectedFileIndex === idx ? '#8b5cf6' : '#999' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                    fontSize: 12, fontWeight: 600, color: selectedFileIndex === idx ? '#111' : '#555',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                }}>
                                    {file.name}
                                </div>
                                <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>
                                    {(file.size / 1024).toFixed(1)} KB
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Preview Area */}
                <div style={{
                    flex: 1,
                    background: '#fcfcfc',
                    borderRadius: 16,
                    border: '1px solid #eee',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    {activeFile ? (
                        <>
                            <div style={{ 
                                borderBottom: '1px solid #eee', 
                                padding: '12px 20px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                background: '#fff'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Eye style={{ width: 14, height: 14, color: '#8b5cf6' }} />
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{activeFile.name}</span>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '6px 12px', borderRadius: 8, background: '#f8f8f8',
                                        border: '1px solid #eee', fontSize: 11, fontWeight: 600,
                                        color: '#555', cursor: 'pointer'
                                    }}
                                >
                                    <Download style={{ width: 14, height: 14 }} />
                                    Download
                                </button>
                            </div>
                            <div style={{ 
                                flex: 1, 
                                overflow: 'auto', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                padding: 20,
                                background: 'rgba(0,0,0,0.02)'
                            }}>
                                {isPdf ? (
                                    <PdfPreview file={activeFile} className="shadow-lg rounded-lg border border-gray-200" scale={1.2} />
                                ) : isImage ? (
                                    <img 
                                        src={URL.createObjectURL(activeFile)} 
                                        alt="Preview" 
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} 
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 40 }}>
                                        <div style={{ width: 60, height: 60, borderRadius: 20, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                            <FileText style={{ width: 28, height: 28, color: '#ccc' }} />
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#666' }}>No Preview Available</div>
                                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>This file type can be downloaded for manual review.</div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 14 }}>
                            Select a file to preview
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Action Bar */}
            <div style={{
                padding: '20px',
                border: '1px solid #fecaca',
                background: '#fffefb',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <AlertCircle style={{ width: 20, height: 20, color: '#d97706' }} />
                    </div>
                    <div>
                         <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Human Approval Required</div>
                         <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Review the data above. Approving will continue the pipeline.</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 24px', borderRadius: 10,
                            background: '#fff', border: '1px solid #fecaca',
                            color: '#ef4444', fontWeight: 600, fontSize: 13,
                            display: 'flex', alignItems: 'center', gap: 8,
                            cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                    >
                        <X style={{ width: 16, height: 16 }} />
                        Reject & Stop
                    </button>
                    <button
                        onClick={() => onConfirm({ files })}
                        style={{
                            padding: '10px 28px', borderRadius: 10,
                            background: '#8b5cf6', border: 'none',
                            color: '#fff', fontWeight: 700, fontSize: 13,
                            display: 'flex', alignItems: 'center', gap: 8,
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <Check style={{ width: 17, height: 17 }} />
                        Approve & Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
