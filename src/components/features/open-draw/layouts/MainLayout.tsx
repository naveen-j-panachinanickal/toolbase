
import { useState, useRef, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useOpenDraw } from '@/hooks/useOpenDraw';
import { DrawCanvas } from '../canvas/DrawCanvas';
import { ShapeLibrary } from '../panels/ShapeLibrary';
import { PropertiesPanel } from '../panels/PropertiesPanel';
import { Undo2, Redo2, Download, Upload, Moon, Sun, Menu, ChevronLeft, ChevronRight, FileText, ChevronDown, FileCode, FileImage, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { exportAsPng, exportAsSvg, exportAsPdf } from '../utils/export-utils';

export function OpenDrawLayout() {
    const openDraw = useOpenDraw();
    const { undo, redo, canUndo, canRedo, saveGraph, loadGraph, nodes, edges, setNodes, setEdges, selectedNodes, selectedEdges } = openDraw;

    const [isDark, setIsDark] = useState(false);
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [fileMenuOpen, setFileMenuOpen] = useState(false);

    // Export Modal State
    const [exportModal, setExportModal] = useState<{ open: boolean; type: 'png' | 'svg' | 'pdf' | null }>({ open: false, type: null });
    const [exportBg, setExportBg] = useState<'transparent' | 'white' | 'dark'>('transparent');

    const fileMenuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
                setFileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onDragStart = (event: React.DragEvent, shapeType: string) => {
        event.dataTransfer.setData('application/reactflow', shapeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleNodeChange = (changes: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (selectedNodes.includes(node.id)) {
                    return {
                        ...node,
                        data: { ...node.data, ...changes }
                    };
                }
                return node;
            })
        );
    };

    const handleEdgeChange = (changes: any) => {
        setEdges((eds) =>
            eds.map((edge) => {
                if (selectedEdges.includes(edge.id)) {
                    const newStyle = {
                        ...(edge.style || {}),
                        ...(changes.style || {})
                    };
                    const { style: _s, ...otherChanges } = changes;
                    return {
                        ...edge,
                        ...otherChanges,
                        style: newStyle
                    };
                }
                return edge;
            })
        );
    };

    const handleImport = (type: 'svg' | 'xml') => {
        const promptText = type === 'svg'
            ? 'Paste SVG string:'
            : 'Paste XML Stencil definition:';
        const input = prompt(promptText);
        if (input) {
            const event = new CustomEvent('open-draw-import-shape', { detail: input });
            window.dispatchEvent(event);
        }
        setFileMenuOpen(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            // Dispatch import event with special prefix for image
            const importEvent = new CustomEvent('open-draw-import-shape', {
                detail: `IMAGE_DATA:${base64}`
            });
            window.dispatchEvent(importEvent);
        };
        reader.readAsDataURL(file);
        setFileMenuOpen(false);
        // Reset input so the same file can be uploaded again
        e.target.value = '';
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const svgFileInputRef = useRef<HTMLInputElement>(null);

    const handleSvgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            // Standard import event (DrawCanvas handles SVG tags automatically)
            const importEvent = new CustomEvent('open-draw-import-shape', {
                detail: content
            });
            window.dispatchEvent(importEvent);
        };
        reader.readAsText(file);
        setFileMenuOpen(false);
        // Reset input so the same file can be uploaded again
        e.target.value = '';
    };

    const openExportModal = (type: 'png' | 'svg' | 'pdf') => {
        setExportModal({ open: true, type });
        setFileMenuOpen(false);
    };

    const performExport = () => {
        const type = exportModal.type;
        if (!type) return;

        // Capture parent element to include background color (dark mode support)
        const flowElement = document.querySelector('.react-flow')?.parentElement as HTMLElement;
        if (!flowElement) return;

        // Determine background color
        let bgColor: string | undefined = undefined;
        if (exportBg === 'white') bgColor = '#ffffff';
        if (exportBg === 'dark') bgColor = '#1e1e1e';
        // 'transparent' leaves it undefined, which logic handles (or we can pass 'transparent' if needed, but 'undefined' usually means 'use whatever is there' or 'transparent' in html-to-image depending on setup. 
        // Actually, toPng defaults to transparent if not set. BUT if we want to capture the "Theme" background, we might need to manually set it if the element itself uses CSS background.
        // If we want explicit transparent, undefined is good. 
        // If we want "Current Theme", we might need to READ the computed style or pass the theme color.

        // Let's stick to explicit choices requested: Transparent, White, Dark.

        switch (type) {
            case 'png':
                exportAsPng(flowElement, 'open-draw-diagram', bgColor);
                break;
            case 'svg':
                exportAsSvg(flowElement, 'open-draw-diagram', bgColor);
                break;
            case 'pdf':
                exportAsPdf(flowElement, 'open-draw-diagram', bgColor);
                break;
        }
        setExportModal({ open: false, type: null });
    };

    return (
        <div className={`flex flex-col h-screen w-full overflow-hidden bg-white dark:bg-[#09090b] ${isDark ? 'dark' : ''}`}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
            />
            <input
                type="file"
                ref={svgFileInputRef}
                onChange={handleSvgFileUpload}
                className="hidden"
                accept=".svg"
            />

            {/* Main Toolbar / Header */}
            <div className="h-12 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0A0A0A] px-4 flex items-center justify-between z-40 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#252525] rounded transition-colors">
                        <Menu className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm text-gray-800 dark:text-white">OpenDraw</span>
                    </div>

                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

                    {/* File Menu */}
                    <div className="relative" ref={fileMenuRef}>
                        <button
                            onClick={() => setFileMenuOpen(!fileMenuOpen)}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#252525] rounded transition-colors"
                        >
                            File <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </button>

                        {fileMenuOpen && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workspace</div>
                                <button onClick={saveGraph} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <Download className="w-4 h-4" /> Save Graph (JSON)
                                </button>
                                <button onClick={loadGraph} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <Upload className="w-4 h-4" /> Load Graph
                                </button>

                                <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

                                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Export</div>
                                <button onClick={() => openExportModal('png')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <FileImage className="w-4 h-4 text-purple-500" /> Export as PNG
                                </button>
                                <button onClick={() => openExportModal('svg')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <FileCode className="w-4 h-4 text-pink-500" /> Export as SVG
                                </button>
                                <button onClick={() => openExportModal('pdf')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <FileText className="w-4 h-4 text-red-500" /> Export as PDF
                                </button>

                                <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

                                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Import</div>
                                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <FileImage className="w-4 h-4 text-emerald-500" /> Import Image File
                                </button>
                                <button onClick={() => handleImport('svg')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <FileCode className="w-4 h-4 text-pink-500" /> Import SVG String
                                </button>
                                <button onClick={() => svgFileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <FileCode className="w-4 h-4 text-emerald-500" /> Import SVG File
                                </button>
                                <button onClick={() => handleImport('xml')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <FileCode className="w-4 h-4 text-orange-500" /> Import XML Stencil
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

                    {/* Basic Actions */}
                    <div className="flex items-center gap-1">
                        <button onClick={undo} disabled={!canUndo} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#252525] rounded disabled:opacity-30">
                            <Undo2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button onClick={redo} disabled={!canRedo} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#252525] rounded disabled:opacity-30">
                            <Redo2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setIsDark(!isDark)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#252525] rounded transition-colors">
                        {isDark ? <Sun className="w-4 h-4 text-gray-300" /> : <Moon className="w-4 h-4 text-gray-600" />}
                    </button>
                    <button
                        onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                        className={`p-1.5 hover:bg-gray-100 dark:hover:bg-[#252525] rounded transition-colors ${rightSidebarOpen ? 'bg-gray-100 dark:bg-[#252525]' : ''}`}
                    >
                        {rightSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Shapes */}
                <div
                    className={`transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800 overflow-hidden ${leftSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'}`}
                >
                    <ShapeLibrary onDragStart={onDragStart} />
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative h-full bg-slate-50 dark:bg-[#0f0f0f]">
                    <ReactFlowProvider>
                        <DrawCanvas openDraw={openDraw} isDark={isDark} />
                    </ReactFlowProvider>
                </div>

                {/* Right Sidebar: Properties */}
                <div
                    className={`transition-all duration-300 ease-in-out border-l border-gray-200 dark:border-gray-800 overflow-hidden ${rightSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'}`}
                >
                    <PropertiesPanel
                        selectedNodes={nodes.filter(n => selectedNodes.includes(n.id))}
                        selectedEdges={edges.filter(e => selectedEdges.includes(e.id))}
                        onNodeChange={handleNodeChange}
                        onEdgeChange={handleEdgeChange}
                        isOpen={rightSidebarOpen}
                        onClose={() => setRightSidebarOpen(false)}
                    />
                </div>
            </div>

            {/* Export Options Modal */}
            {exportModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-[320px] bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Export as {exportModal.type?.toUpperCase()}</h3>
                            <button onClick={() => setExportModal({ open: false, type: null })} className="p-1 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Background</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setExportBg('transparent')}
                                        className={`px-3 py-2 rounded-lg text-sm border transition-all ${exportBg === 'transparent' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="w-4 h-4 border border-gray-300 rounded-full mb-1 mx-auto bg-[conic-gradient(at_top_left,gray_25%_0%,white_0%_25%,gray_50%_0%,white_0%_25%)] bg-[length:4px_4px]" />
                                        None
                                    </button>
                                    <button
                                        onClick={() => setExportBg('white')}
                                        className={`px-3 py-2 rounded-lg text-sm border transition-all ${exportBg === 'white' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="w-4 h-4 border border-gray-300 rounded-full mb-1 mx-auto bg-white" />
                                        White
                                    </button>
                                    <button
                                        onClick={() => setExportBg('dark')}
                                        className={`px-3 py-2 rounded-lg text-sm border transition-all ${exportBg === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="w-4 h-4 border border-gray-500 rounded-full mb-1 mx-auto bg-[#1e1e1e]" />
                                        Dark
                                    </button>
                                </div>
                            </div>

                            <Button onClick={performExport} className="w-full">
                                Download {exportModal.type?.toUpperCase()}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

