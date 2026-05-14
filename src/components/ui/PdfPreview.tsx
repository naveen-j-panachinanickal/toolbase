import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface PdfPreviewProps {
    file?: File;
    pdfDocument?: any; // pdfjs-dist document proxy
    className?: string;
    pageNumber?: number;
    scale?: number;
    onLoadSuccess?: (numPages: number) => void;
    onLoadError?: (error: Error) => void;
    onResize?: (width: number, height: number) => void;
}

export const PdfPreview = ({
    file,
    pdfDocument,
    className,
    pageNumber = 1,
    scale = 1,
    onLoadSuccess,
    onLoadError,
    onResize,
}: PdfPreviewProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [passwordProtected, setPasswordProtected] = useState(false);

    useEffect(() => {
        let active = true;
        let renderTask: any = null;
        setPasswordProtected(false);

        const renderPage = async () => {
            setLoading(true);
            try {
                let pdf = pdfDocument;

                if (!pdf && file) {
                    const pdfjsLib = await import('pdfjs-dist');

                    if (typeof window !== 'undefined' && 'Worker' in window) {
                        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
                    }

                    const arrayBuffer = await file.arrayBuffer();
                    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                }

                if (!pdf || !active) return;

                if (onLoadSuccess) onLoadSuccess(pdf.numPages);

                const page = await pdf.getPage(pageNumber);

                if (!active) return;

                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;

                if (canvas) {
                    const context = canvas.getContext('2d');
                    
                    // Only update and trigger onResize if dimensions actually changed
                    if (canvas.width !== Math.floor(viewport.width) || canvas.height !== Math.floor(viewport.height)) {
                        canvas.width = Math.floor(viewport.width);
                        canvas.height = Math.floor(viewport.height);
                        if (onResize) onResize(canvas.width, canvas.height);
                    }

                    if (context && active) {
                        renderTask = page.render({ canvasContext: context, viewport } as any);
                        await renderTask.promise;
                    }
                }
            } catch (error: any) {
                if (!active || error?.name === 'RenderingCancelledException') return;
                // PasswordException — pdf.js throws when the PDF requires a password
                if (error?.name === 'PasswordException' || error?.message?.toLowerCase().includes('password')) {
                    setPasswordProtected(true);
                } else {
                    console.error('Error rendering PDF:', error);
                    if (onLoadError) onLoadError(error as Error);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        renderPage();
        return () => { 
            active = false; 
            if (renderTask) {
                renderTask.cancel();
            }
        };
    }, [file, pdfDocument, pageNumber, scale, onLoadSuccess, onLoadError, onResize]);

    if (passwordProtected) {
        return (
            <div className={cn('relative flex flex-col items-center justify-center gap-2 bg-gray-50 rounded-lg border border-dashed border-gray-200', className)}>
                <Lock className="w-8 h-8 text-gray-300" />
                <span className="text-xs text-gray-400 font-medium">Password protected</span>
            </div>
        );
    }

    return (
        <div className={cn('relative bg-white/50', className)}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm z-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            )}
            <canvas ref={canvasRef} className="shadow-2xl border border-gray-200 block" />
        </div>
    );
};
