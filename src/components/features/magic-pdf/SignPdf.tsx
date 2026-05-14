'use client';
/**
 * SignPdf — unified component for the direct tool and pipeline INP.
 *
 * Standalone mode  (direct tool):  <SignPdf />
 *   → Draw/type/upload signature → place on PDF → Apply & Save
 *
 * Interaction mode (pipeline INP): <SignPdf files={[pdf]} onConfirm={fn} onCancel={fn} />
 *   → Pre-seeded with upstream file; same signature UI
 *   → Confirm serialises placed signatures as JSON config (no execution here)
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FileUploader } from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import {
    Download,
    RefreshCw,
    CheckCircle,
    CheckCheck,
    PenTool,
    Type,
    Upload,
    Trash2,
    X,
    Move,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { signPdf } from '@/lib/pdf-actions';
import { PdfPreview } from '@/components/ui/PdfPreview';
import type { TIPInteractionProps } from '@/tip/protocol';

/**
 * Converts a data URL to a Uint8Array without any network requests.
 * Used instead of fetch(dataUrl) to stay fully client-side.
 */
function dataUrlToBytes(dataUrl: string): ArrayBuffer {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export type SignPdfProps = Partial<TIPInteractionProps>;


interface SignatureInstance {
    id: string;
    dataUrl: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    width: number; // percentage 0-100
    height: number; // percentage 0-100
    pageIndex: number;
}

export default function SignPdf({
    files: seedFiles,
    config,
    onConfirm,
    onCancel,
}: SignPdfProps = {}) {
    /** true when used inside the pipeline InteractionModal */
    const isInteractionMode = typeof onConfirm === 'function';

    const [file, setFile] = useState<File | null>(seedFiles?.[0] ?? null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1);

    // Signature management
    const [currentSignature, setCurrentSignature] = useState<string | null>(null);
    const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw');
    const [signatures, setSignatures] = useState<SignatureInstance[]>([]);
    const [activeSignatureId, setActiveSignatureId] = useState<string | null>(null);

    // Draw state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Type state
    const [signatureText, setSignatureText] = useState('');
    const [selectedFont, setSelectedFont] = useState('Dancing Script');

    // Lazy-load cursive signature fonts only when in 'type' mode
    useEffect(() => {
        if (mode !== 'type') return;
        const id = 'sign-pdf-cursive-fonts';
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&display=swap';
        document.head.appendChild(link);
    }, [mode]);

    // Preview area ref for coordinate calculation
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Auto-reset when file changes
    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setResultPdfUrl(null);
            setSignatures([]);
            setCurrentPage(1);
        }
    };

    // Pre-seed from INP props (runs once on mount if seedFiles provided)
    useEffect(() => {
        if (seedFiles?.[0]) {
            setFile(seedFiles[0]);
            setCurrentPage(1);
            if (config && config.signatures) {
                try {
                    const savedSignatures = JSON.parse(config.signatures as string);
                    setSignatures(savedSignatures);
                } catch (e) {
                    setSignatures([]);
                }
            } else {
                setSignatures([]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Drawing Logic
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let x, y;
        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let x, y;
        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.lineTo(x, y);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const saveDrawing = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Check if canvas is empty? (Optional)
        const dataUrl = canvas.toDataURL('image/png');
        setCurrentSignature(dataUrl);
    };

    // Type Logic
    const generateTypeText = useCallback(() => {
        if (!signatureText) return;

        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `60px ${selectedFont}, cursive, sans-serif`;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(signatureText, canvas.width / 2, canvas.height / 2);

        setCurrentSignature(canvas.toDataURL('image/png'));
    }, [signatureText, selectedFont]);

    useEffect(() => {
        if (mode === 'type') {
            generateTypeText();
        }
    }, [signatureText, selectedFont, mode, generateTypeText]);

    // Upload Logic
    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setCurrentSignature(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Placement Logic
    const placeSignature = () => {
        if (!currentSignature) return;

        const newSig: SignatureInstance = {
            id: Math.random().toString(36).substr(2, 9),
            dataUrl: currentSignature,
            x: 50, // Center
            y: 50,
            width: 20,
            height: 10,
            pageIndex: currentPage - 1
        };

        setSignatures([...signatures, newSig]);
        setActiveSignatureId(newSig.id);
    };

    const updateSignaturePosition = (id: string, x: number, y: number) => {
        setSignatures(prev => prev.map(sig =>
            sig.id === id ? { ...sig, x, y } : sig
        ));
    };

    const removeSignature = (id: string) => {
        setSignatures(prev => prev.filter(sig => sig.id !== id));
        if (activeSignatureId === id) setActiveSignatureId(null);
    };

    const handleApply = async () => {
        if (!file || signatures.length === 0) return;

        setIsProcessing(true);
        try {
            let currentFileBytes = await file.arrayBuffer();
            let currentFile = new File([currentFileBytes], file.name, { type: 'application/pdf' });

            // Apply each signature sequentially
            // Note: In a real app with many signatures, we might want to optimize this
            // for pdf-lib to do it in one pass, but for simplicity of using the existing action:

            let resultBytes: Uint8Array = new Uint8Array();

            for (let i = 0; i < signatures.length; i++) {
                const sig = signatures[i];

                // We need to get the real page size to convert percentages
                // But pdf-actions.ts handles the file. For now let's modify the action
                // to accept multiple signatures or just do it here.

                // Let's use a specialized function for multi-sign if possible
                // Or just loop it (less efficient but works)

                // To avoid multiple File re-creations, let's keep track of the Uint8Array
            }

            // Re-implement multi-sign logic here for efficiency
            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.load(currentFileBytes);

            for (const sig of signatures) {
                const sigImgBytes = dataUrlToBytes(sig.dataUrl);
                let sigImg;
                if (sig.dataUrl.includes('image/png')) {
                    sigImg = await pdfDoc.embedPng(sigImgBytes);
                } else {
                    sigImg = await pdfDoc.embedJpg(sigImgBytes);
                }

                const pages = pdfDoc.getPages();
                const page = pages[sig.pageIndex];
                const { width: pW, height: pH } = page.getSize();

                const realX = (sig.x / 100) * pW - ((sig.width / 100) * pW) / 2;
                const topY = (sig.y / 100) * pH;
                const realH = (sig.height / 100) * pH;
                const realW = (sig.width / 100) * pW;

                // pdf-lib's y is from bottom. Web's y is from top.
                const realY = pH - topY - realH / 2;

                page.drawImage(sigImg, {
                    x: realX,
                    y: realY,
                    width: realW,
                    height: realH,
                });
            }

            const finalBytes = await pdfDoc.save();
            const blob = new Blob([finalBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setResultPdfUrl(url);

        } catch (error) {
            console.error('Error signing PDF:', error);
            alert('Failed to sign PDF: ' + (error as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Interaction: confirm placed signatures to the pipeline ────────────────
    const handleConfirm = () => {
        if (!file || !onConfirm) return;
        onConfirm({
            files: [file],
            config: {
                signatures: JSON.stringify(signatures),
            },
        });
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 h-full flex flex-col">
            <AnimatePresence mode="wait">
                {!file ? (
                    <m.div
                        key="upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <Card className="p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                                    <PenTool className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">Sign PDF</h2>
                                <p className="text-text-muted">Add digital signatures to your PDF documents easily.</p>
                            </div>
                            <FileUploader
                                onFilesSelected={handleFileSelected}
                                accept=".pdf"
                                multiple={false}
                                className="max-w-2xl mx-auto"
                            />
                        </Card>
                    </m.div>
                ) : (
                    <m.div
                        key="workspace"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col lg:flex-row gap-6 h-full"
                    >
                        {/* Sidebar: Signature Creator */}
                        <div className="w-full lg:w-80 flex flex-col gap-6">
                            <Card className="p-4 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-text-primary">Your Signature</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Change PDF</Button>
                                </div>

                                <div className="flex bg-surface-secondary p-1 rounded-lg">
                                    <button
                                        className={cn("flex-1 flex flex-col items-center py-2 rounded-md transition-all", mode === 'draw' ? "bg-surface-elevated shadow-sm" : "text-text-muted")}
                                        onClick={() => setMode('draw')}
                                    >
                                        <PenTool className="w-4 h-4 mb-1" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">Draw</span>
                                    </button>
                                    <button
                                        className={cn("flex-1 flex flex-col items-center py-2 rounded-md transition-all", mode === 'type' ? "bg-surface-elevated shadow-sm" : "text-text-muted")}
                                        onClick={() => setMode('type')}
                                    >
                                        <Type className="w-4 h-4 mb-1" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">Type</span>
                                    </button>
                                    <button
                                        className={cn("flex-1 flex flex-col items-center py-2 rounded-md transition-all", mode === 'upload' ? "bg-surface-elevated shadow-sm" : "text-text-muted")}
                                        onClick={() => setMode('upload')}
                                    >
                                        <Upload className="w-4 h-4 mb-1" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                                    </button>
                                </div>

                                <div className="aspect-3/2 bg-surface-elevated border-2 border-dashed border-border-medium rounded-xl overflow-hidden relative group">
                                    {mode === 'draw' && (
                                        <div className="w-full h-full">
                                            <canvas
                                                ref={canvasRef}
                                                width={300}
                                                height={200}
                                                className="w-full h-full cursor-crosshair touch-none"
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                            />
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={clearCanvas}>
                                                    <RefreshCw className="w-3 h-3 text-text-faint" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {mode === 'type' && (
                                        <div className="w-full h-full p-4 flex flex-col gap-2 bg-surface-secondary/30">
                                            <input
                                                type="text"
                                                value={signatureText}
                                                onChange={(e) => setSignatureText(e.target.value)}
                                                placeholder="Type your name..."
                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-surface-elevated focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                            <select
                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-surface-elevated"
                                                value={selectedFont}
                                                onChange={(e) => setSelectedFont(e.target.value)}
                                            >
                                                <option value="Dancing Script">Dancing Script</option>
                                                <option value="Great Vibes">Great Vibes</option>
                                                <option value="Pacifico">Pacifico</option>
                                                <option value="Alex Brush">Alex Brush</option>
                                            </select>
                                            <div className="flex-1 flex items-center justify-center overflow-hidden">
                                                <p
                                                    className="text-3xl line-clamp-1 p-2"
                                                    style={{ fontFamily: `'${selectedFont}', cursive` }}
                                                >
                                                    {signatureText || 'Preview'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {mode === 'upload' && (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                            <input
                                                type="file"
                                                id="sig-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleSignatureUpload}
                                            />
                                            <label
                                                htmlFor="sig-upload"
                                                className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-surface-secondary transition-colors"
                                            >
                                                {currentSignature && mode === 'upload' ? (
                                                    <img src={currentSignature} alt="Signature Upload" className="max-h-full max-w-full object-contain" />
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-text-muted mb-2" />
                                                        <p className="text-xs text-text-muted font-medium">Click to upload image</p>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={mode === 'draw' ? () => { saveDrawing(); placeSignature(); } : placeSignature}
                                >
                                    Place Signature
                                </Button>
                            </Card>

                            <Card className="p-4 flex flex-col gap-3">
                                <h4 className="text-sm font-semibold text-text-primary px-1">Signatures in Document</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {signatures.length === 0 ? (
                                        <p className="text-xs text-text-faint text-center py-4 italic">No signatures placed yet</p>
                                    ) : (
                                        signatures.map((sig, idx) => (
                                            <div
                                                key={sig.id}
                                                className={cn(
                                                    "flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer group",
                                                    activeSignatureId === sig.id ? "border-primary bg-primary/5 shadow-sm" : "border-border-subtle hover:border-border-medium"
                                                )}
                                                onClick={() => {
                                                    setActiveSignatureId(sig.id);
                                                    setCurrentPage(sig.pageIndex + 1);
                                                }}
                                            >
                                                <div className="w-12 h-8 bg-surface-elevated border border-border-subtle rounded overflow-hidden flex items-center justify-center">
                                                    <img src={sig.dataUrl} alt="sig" className="max-h-full max-w-full grayscale" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-text-faint uppercase tracking-tighter">Page {sig.pageIndex + 1}</p>
                                                    <p className="text-xs font-medium text-text-secondary truncate">Signature #{idx + 1}</p>
                                                </div>
                                                <button
                                                    className="opacity-0 group-hover:opacity-100 text-text-faint hover:text-red-500 p-1"
                                                    onClick={(e) => { e.stopPropagation(); removeSignature(sig.id); }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>

                            <div className="mt-auto">
                                {isInteractionMode ? (
                                    <div className="flex gap-2">
                                        <Button variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Button>
                                        <Button
                                            size="lg"
                                            className="flex-1 shadow-lg h-12 gap-2"
                                            disabled={signatures.length === 0}
                                            onClick={handleConfirm}
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                            Confirm ({signatures.length})
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="lg"
                                        className="w-full shadow-lg h-12"
                                        disabled={signatures.length === 0 || isProcessing}
                                        isLoading={isProcessing}
                                        onClick={handleApply}
                                    >
                                        Apply &amp; Save PDF
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Document Preview */}
                        <div className="flex-1 flex flex-col gap-4 bg-surface-secondary rounded-2xl border border-border-medium overflow-hidden relative shadow-inner">
                            {/* Toolbar */}
                            <div className="h-14 bg-surface-elevated border-b flex items-center justify-between px-6 z-10 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="flex bg-surface-secondary rounded-lg p-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage <= 1}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <div className="px-3 flex items-center text-xs font-bold text-text-muted border-x border-border-medium mx-1 min-w-[60px] justify-center">
                                            {currentPage} / {totalPages || '?'}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage >= totalPages}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="h-6 w-px bg-border-medium" />

                                    <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-1">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
                                            <ZoomOut className="w-4 h-4 text-text-muted" />
                                        </Button>
                                        <span className="text-[10px] font-bold text-text-muted w-10 text-center">{Math.round(scale * 100)}%</span>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setScale(s => Math.min(2, s + 0.1))}>
                                            <ZoomIn className="w-4 h-4 text-text-muted" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="text-xs font-medium text-text-faint">
                                    Click and drag signatures to reposition
                                </div>
                            </div>

                            {/* Main Preview Area */}
                            <div className="flex-1 overflow-auto p-8 flex justify-center items-start custom-scrollbar">
                                <div
                                    ref={previewContainerRef}
                                    className="relative shadow-2xl transition-all duration-300 transform-gpu"
                                    style={{
                                        width: 'fit-content',
                                        transform: `scale(${scale})`,
                                        transformOrigin: 'top center'
                                    }}
                                >
                                    <PdfPreview
                                        file={file}
                                        pageNumber={currentPage}
                                        onLoadSuccess={setTotalPages}
                                        className="rounded-lg overflow-hidden"
                                    />

                                    {/* Signatures overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        {signatures.filter(s => s.pageIndex === currentPage - 1).map(sig => (
                                            <SignatureLayer
                                                key={sig.id}
                                                sig={sig}
                                                isActive={activeSignatureId === sig.id}
                                                onSelect={() => setActiveSignatureId(sig.id)}
                                                onMove={updateSignaturePosition}
                                                onRemove={() => removeSignature(sig.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Controls (Mobile) */}
                            {resultPdfUrl && (
                                <div className="absolute inset-0 bg-surface-elevated/95 backdrop-blur-md z-40 flex items-center justify-center p-8">
                                    <m.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="max-w-md w-full text-center space-y-6"
                                    >
                                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
                                            <CheckCircle className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-text-primary border-none">Ready to Download</h3>
                                            <p className="text-text-muted">Your signed PDF is ready with {signatures.length} signature{signatures.length !== 1 ? 's' : ''} applied.</p>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <a href={resultPdfUrl} download={`signed_${file.name}`} className="block">
                                                <Button className="w-full h-12 shadow-lg hover:shadow-xl transition-all">
                                                    <Download className="w-5 h-5 mr-3" />
                                                    Download Signed PDF
                                                </Button>
                                            </a>
                                            <Button variant="ghost" className="w-full" onClick={() => { setResultPdfUrl(null); setSignatures([]); }}>
                                                Sign Another
                                            </Button>
                                        </div>
                                    </m.div>
                                </div>
                            )}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface SignatureLayerProps {
    sig: SignatureInstance;
    isActive: boolean;
    onSelect: () => void;
    onMove: (id: string, x: number, y: number) => void;
    onRemove: () => void;
}

const SignatureLayer = ({ sig, isActive, onSelect, onMove, onRemove }: SignatureLayerProps) => {
    const sigRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
        setIsDragging(true);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !sigRef.current || !sigRef.current.parentElement) return;

        const container = sigRef.current.parentElement;
        const rect = container.getBoundingClientRect();

        // Calculate percentages
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Clamp values
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));

        onMove(sig.id, clampedX, clampedY);
    }, [isDragging, sig.id, onMove]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={sigRef}
            className={cn(
                "absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 cursor-grab group",
                isActive ? "z-30" : "z-20",
                isDragging && "cursor-grabbing"
            )}
            style={{
                left: `${sig.x}%`,
                top: `${sig.y}%`,
                width: `${sig.width}%`,
                height: `${sig.height}%`,
            }}
            onMouseDown={handleMouseDown}
        >
            <div className={cn(
                "relative w-full h-full p-2 border-2 transition-all rounded",
                isActive ? "border-primary bg-primary/10" : "border-transparent group-hover:border-primary/40 group-hover:bg-primary/5"
            )}>
                <img src={sig.dataUrl} alt="sig" className="w-full h-full object-contain pointer-events-none drop-shadow-sm grayscale contrast-125" />

                {/* Control points */}
                {isActive && (
                    <>
                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm" />
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm" />
                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm" />
                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm" />

                        <button
                            className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center bg-red-500 text-background rounded-md p-1 opacity-100 hover:bg-red-600 shadow-sm"
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>

                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center bg-foreground text-background rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest whitespace-nowrap shadow-sm opacity-100 h-4">
                            Move <Move className="w-2 h-2 ml-1" />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
