'use client';

import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Maximize2, Minimize2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { PdfPreview } from './PdfPreview';
import type { TIPPayload } from '@/tip/protocol';

interface FilePreviewModalProps {
    file: File | TIPPayload | null;
    onClose: () => void;
}

/**
 * FilePreviewModal — A high-fidelity, full-screen overlay for previewing any file type in the pipeline.
 *
 * Supports:
 * - Images (PNG, JPEG, WebP, etc.)
 * - PDFs (via PdfPreview / pdf.js)
 * - Text/JSON (Simple syntax highlighting)
 * - Fallback for other binary types
 */
export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
    const [isMaximized, setIsMaximized] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pdfPage, setPdfPage] = useState(1);
    const [pdfTotalPages, setPdfTotalPages] = useState(1);
    const [imageZoom, setImageZoom] = useState(1);

    // Extract basic info
    const isPayload = file && 'data' in file && 'contentType' in file;
    const blob = isPayload ? (file as TIPPayload).data : (file as File);
    const filename = isPayload ? (file as TIPPayload).meta.filename : (file as File)?.name;
    const contentType = isPayload ? (file as TIPPayload).contentType : (file as File)?.type;
    const sizeBytes = isPayload ? (file as TIPPayload).meta.sizeBytes : (file as File)?.size;

    useEffect(() => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setPdfPage(1); // Reset page on file change
            setImageZoom(1); // Reset zoom
            return () => URL.revokeObjectURL(url);
        }
    }, [blob]);

    const isImage = contentType?.startsWith('image/');
    const isPdf = contentType === 'application/pdf';
    const isText = contentType?.startsWith('text/') || contentType === 'application/json';

    // Close on Escape / Page nav with arrows
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (isPdf) {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setPdfPage(p => Math.min(pdfTotalPages, p + 1));
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setPdfPage(p => Math.max(1, p - 1));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, isPdf, pdfTotalPages]);

    if (!file) return null;

    const handleDownload = () => {
        if (!previewUrl || !filename) return;
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = filename;
        a.click();
    };

    return (
        <AnimatePresence>
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(16px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isMaximized ? 0 : '40px',
                } as any}
                onClick={onClose}
            >
                <m.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        maxWidth: isMaximized ? 'none' : 1200,
                        maxHeight: isMaximized ? 'none' : 850,
                        background: '#0a0a0a',
                        borderRadius: isMaximized ? 0 : 20,
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 40px 120px rgba(0,0,0,0.9)',
                    } as any}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Toolbar */}
                    <div style={{
                        height: 64,
                        background: 'rgba(255,255,255,0.02)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 24px',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: 'rgba(52,211,153,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(52,211,153,0.15)',
                            }}>
                                <FileText style={{ width: 17, height: 17, color: '#34d399' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>{filename}</div>
                                <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>
                                    {(sizeBytes! / 1024).toFixed(1)} KB • {contentType}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Controls Layer */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* PDF Pages */}
                            {isPdf && pdfTotalPages > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12, background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button 
                                        onClick={() => setPdfPage(p => Math.max(1, p - 1))}
                                        disabled={pdfPage === 1}
                                        style={{ ...miniButtonStyle, opacity: pdfPage === 1 ? 0.3 : 1 }}
                                    >
                                        <ChevronLeft style={{ width: 16, height: 16 }} />
                                    </button>
                                    <span style={{ fontSize: 11.5, color: '#eee', fontWeight: 600, minWidth: 50, textAlign: 'center' }}>
                                        {pdfPage} / {pdfTotalPages}
                                    </span>
                                    <button 
                                        onClick={() => setPdfPage(p => Math.min(pdfTotalPages, p + 1))}
                                        disabled={pdfPage === pdfTotalPages}
                                        style={{ ...miniButtonStyle, opacity: pdfPage === pdfTotalPages ? 0.3 : 1 }}
                                    >
                                        <ChevronRight style={{ width: 16, height: 16 }} />
                                    </button>
                                </div>
                            )}

                            {/* Image Zoom */}
                            {isImage && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 12, background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button onClick={() => setImageZoom(z => Math.max(0.1, z - 0.2))} style={miniButtonStyle}>
                                        <ZoomOut style={{ width: 16, height: 16 }} />
                                    </button>
                                    <span style={{ fontSize: 11.5, color: '#eee', fontWeight: 600, minWidth: 40, textAlign: 'center' }}>
                                        {Math.round(imageZoom * 100)}%
                                    </span>
                                    <button onClick={() => setImageZoom(z => Math.min(5, z + 0.2))} style={miniButtonStyle}>
                                        <ZoomIn style={{ width: 16, height: 16 }} />
                                    </button>
                                    <button onClick={() => setImageZoom(1)} style={{ ...miniButtonStyle, marginLeft: 4 }} title="Reset Zoom">
                                        <RotateCcw style={{ width: 13, height: 13 }} />
                                    </button>
                                </div>
                            )}

                            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

                            <button onClick={handleDownload} style={toolbarButtonStyle} title="Download">
                                <Download style={{ width: 18, height: 18 }} />
                            </button>
                            <button onClick={() => setIsMaximized(!isMaximized)} style={toolbarButtonStyle} title="Toggle Perspective">
                                {isMaximized ? <Minimize2 style={{ width: 18, height: 18 }} /> : <Maximize2 style={{ width: 18, height: 18 }} />}
                            </button>
                            <button onClick={onClose} style={{ ...toolbarButtonStyle, color: '#ef4444', marginLeft: 4, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }} title="Close (Esc)">
                                <X style={{ width: 20, height: 20 }} />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{
                        flex: 1,
                        background: '#000',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'auto',
                        padding: '40px',
                        alignItems: 'center',
                    }}>
                        <div style={{ margin: 'auto' }}>
                            {isImage && previewUrl ? (
                                <m.img
                                    animate={{ scale: imageZoom }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    src={previewUrl}
                                    alt="Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: imageZoom > 1 ? 'none' : '100%',
                                        objectFit: 'contain',
                                        boxShadow: '0 32px 100px rgba(0,0,0,0.6)',
                                        cursor: 'zoom-in',
                                    } as any}
                                    onClick={() => setImageZoom(z => z === 1 ? 2 : 1)}
                                />
                            ) : isPdf ? (
                                <PdfPreview
                                    file={blob as File}
                                    pageNumber={pdfPage}
                                    onLoadSuccess={setPdfTotalPages}
                                    className="rounded-xl shadow-2xl bg-white"
                                    scale={isMaximized ? 2.0 : 1.5}
                                />
                            ) : isText ? (
                                <div style={{
                                    width: '100%',
                                    minWidth: 800,
                                    maxWidth: 1000,
                                    background: '#0a0a0a',
                                    borderRadius: 16,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    padding: 32,
                                    color: '#d4d4d8',
                                    fontFamily: 'var(--font-mono, monospace)',
                                    fontSize: 14,
                                    lineHeight: 1.7,
                                    overflow: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
                                } as React.CSSProperties}>
                                    <TextContent blob={blob} />
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                                    <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <FileText style={{ width: 32, height: 32, color: '#34d399' }} />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Preview not available</div>
                                        <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>This file type can only be downloaded.</div>
                                    </div>
                                    <button
                                        onClick={handleDownload}
                                        style={{
                                            padding: '12px 24px',
                                            background: '#34d399',
                                            color: '#111',
                                            borderRadius: 12,
                                            fontWeight: 700,
                                            fontSize: 14,
                                            cursor: 'pointer',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Download style={{ width: 18, height: 18 }} />
                                        Download Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </m.div>
            </m.div>
        </AnimatePresence>
    );
}

function TextContent({ blob }: { blob: Blob }) {
    const [text, setText] = useState<string>('Loading content...');

    useEffect(() => {
        blob.text().then(t => {
            if (t.length > 50000) {
                setText(t.slice(0, 50000) + '\n\n... (file truncated for preview)');
            } else {
                setText(t);
            }
        });
    }, [blob]);

    return <div>{text}</div>;
}

const miniButtonStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#aaa',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
};

const toolbarButtonStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};
