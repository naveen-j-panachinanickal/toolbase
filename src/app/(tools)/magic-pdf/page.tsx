'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MergePdf = dynamic(() => import('@/components/features/magic-pdf/MergePdf'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const SplitPdf = dynamic(() => import('@/components/features/magic-pdf/SplitPdf'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const CompressPdf = dynamic(() => import('@/components/features/magic-pdf/CompressPdf'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const RearrangePdf = dynamic(() => import('@/components/features/magic-pdf/RearrangePdf'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const ProtectPdf = dynamic(() => import('@/components/features/magic-pdf/ProtectPdf'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const UnlockPdf = dynamic(() => import('@/components/features/magic-pdf/UnlockPdf'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const SignPdf = dynamic(() => import('@/components/features/magic-pdf/SignPdf'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const EditPdf = dynamic(() => import('@/components/features/magic-pdf/EditPdf'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const PdfToWord = dynamic(() => import('@/components/features/magic-pdf/PdfToWord'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const PdfToImage = dynamic(() => import('@/components/features/magic-pdf/PdfToImage'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const ImageToPdf = dynamic(() => import('@/components/features/magic-pdf/ImageToPdf'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const HtmlToPdf = dynamic(() => import('@/components/features/magic-pdf/HtmlToPdf'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
const MaskPdf = dynamic(() => import('@/components/features/magic-pdf/MaskPdf'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-surface-secondary rounded-2xl" /> });
import {
  Merge,
  Scissors,
  Minimize2,
  Image,
  FileText,
  ArrowUpDown,
  Lock,
  Unlock,
  PenTool,
  Edit3,
  FileCode,
  FileCode2,
  ShieldAlert,
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";
import { ToolSidebar, ToolSidebarItem } from '@/components/ui/ToolSidebar';
import { cn } from '@/lib/utils';

const MagicPdf = () => {
  const [activeTool, setActiveTool] = useState('merge');

  const tools: ToolSidebarItem[] = [
    { id: 'merge', label: 'Merge PDFs', icon: Merge },
    { id: 'split', label: 'Split PDF', icon: Scissors },
    { id: 'compress', label: 'Compress PDF', icon: Minimize2 },
    { id: 'rearrange', label: 'Rearrange Pages', icon: ArrowUpDown },
    { id: 'protect', label: 'Protect PDF', icon: Lock },
    { id: 'unlock', label: 'Unlock PDF', icon: Unlock },
    { id: 'sign', label: 'Sign PDF', icon: PenTool },
    { id: 'edit', label: 'Edit PDF', icon: Edit3, badge: 'Beta' },
    { id: 'redact', label: 'Redact & Mask', icon: ShieldAlert, badge: 'Beta' },
    { id: 'word', label: 'PDF to Word', icon: FileCode, badge: 'Beta' },
    { id: 'convert', label: 'PDF to Image', icon: Image },
    { id: 'img2pdf', label: 'Image to PDF', icon: Image },
    { id: 'html2pdf', label: 'HTML to PDF', icon: FileCode2, badge: 'Beta' },
  ];

  const activeToolLabel = tools.find(t => t.id === activeTool)?.label || 'Tool';
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Update page title when tool changes
  useEffect(() => {
    document.title = `${activeToolLabel} | OBN toolbase`;

    // Cleanup: reset to layout default when component unmounts
    return () => {
      document.title = 'Magic PDF | OBN toolbase';
    };
  }, [activeToolLabel]);

  return (
    <div className="flex h-screen overflow-hidden bg-[color:var(--background)] relative">
      <ToolSidebar
        title="PDF Tools"
        items={tools}
        activeId={activeTool}
        onSelect={setActiveTool}
        isOpen={isSidebarOpen}
        onToggle={setSidebarOpen}
      />

      {/* Main Editor Area */}
      <main className="flex-1 overflow-hidden relative bg-transparent flex flex-col">
        <header className="h-14 border-b border-[color:var(--border-subtle)] bg-[var(--surface-overlay)] backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300">
          <div className={cn("flex items-center gap-2 transition-all duration-300", !isSidebarOpen && "pl-12")}>
            <div className="flex items-center text-sm text-text-muted">
              <span className="font-semibold text-text-primary mr-2">Magic PDF</span>
              <span className="text-text-muted">/</span>
              <span className="ml-2">{activeToolLabel}</span>
            </div>
          </div>
          <ReturnToToolsButton />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="h-full w-full">
            <AnimatePresence mode="wait">
              {activeTool === 'merge' && (
                <m.div
                  key="merge"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <MergePdf />
                </m.div>
              )}

              {activeTool === 'split' && (
                <m.div
                  key="split"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <SplitPdf />
                </m.div>
              )}

              {activeTool === 'compress' && (
                <m.div
                  key="compress"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <CompressPdf />
                </m.div>
              )}

              {activeTool === 'rearrange' && (
                <m.div
                  key="rearrange"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <RearrangePdf />
                </m.div>
              )}

              {activeTool === 'protect' && (
                <m.div
                  key="protect"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ProtectPdf />
                </m.div>
              )}

              {activeTool === 'unlock' && (
                <m.div
                  key="unlock"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <UnlockPdf />
                </m.div>
              )}

              {activeTool === 'sign' && (
                <m.div
                  key="sign"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <SignPdf />
                </m.div>
              )}

              {activeTool === 'edit' && (
                <m.div
                  key="edit"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <EditPdf />
                </m.div>
              )}

              {activeTool === 'word' && (
                <m.div
                  key="word"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <PdfToWord />
                </m.div>
              )}

              {activeTool === 'redact' && (
                <m.div
                  key="redact"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <MaskPdf />
                </m.div>
              )}

              {activeTool === 'convert' && (
                <m.div
                  key="convert"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <PdfToImage />
                </m.div>
              )}

              {activeTool === 'img2pdf' && (
                <m.div
                  key="img2pdf"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ImageToPdf />
                </m.div>
              )}

              {activeTool === 'html2pdf' && (
                <m.div
                  key="html2pdf"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <HtmlToPdf />
                </m.div>
              )}

              {activeTool !== 'merge' && activeTool !== 'split' && activeTool !== 'compress' && activeTool !== 'rearrange' && activeTool !== 'protect' && activeTool !== 'unlock' && activeTool !== 'sign' && activeTool !== 'edit' && activeTool !== 'redact' && activeTool !== 'word' && activeTool !== 'convert' && activeTool !== 'img2pdf' && activeTool !== 'html2pdf' && (
                <m.div
                  key="placeholder"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex h-full items-center justify-center p-12 text-center text-text-faint"
                >
                  <Card className="p-12 max-w-md w-full flex flex-col items-center gap-6 border-dashed border-2 bg-transparent shadow-none">
                    <div className="w-20 h-20 rounded-full bg-surface-secondary flex items-center justify-center">
                      {(() => {
                        const Icon = tools.find(t => t.id === activeTool)?.icon || FileText;
                        return <Icon className="w-10 h-10 opacity-20" />
                      })()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">Coming Soon</h3>
                      <p>The <strong>{activeToolLabel}</strong> tool is currently under development.</p>
                    </div>
                    <Button variant="outline" onClick={() => setActiveTool('merge')}>
                      Go to Merge Tool
                    </Button>
                  </Card>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MagicPdf;
