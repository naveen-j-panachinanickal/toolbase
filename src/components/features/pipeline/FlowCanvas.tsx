import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    ConnectionMode,
    ReactFlowProvider,
    BackgroundVariant,
    useReactFlow,
    ConnectionLineComponentProps,
    Node,
    Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { NodePalette, PaletteFilterContext } from './NodePalette';
import { InspectorPanel } from './InspectorPanel';
import { PipelineToolbar } from './PipelineToolbar';
import { InteractionModal } from './InteractionModal';
import { SavePipelineModal } from './SavePipelineModal';
import { useFlowGraph } from './hooks/useFlowGraph';
import { useFlowEngineSync } from './hooks/useFlowEngineSync';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useGraphSerializer } from './hooks/useGraphSerializer';
import { SavedPipelinesModal } from './SavedPipelinesModal';
import { FilePreviewModal } from '@/components/ui/FilePreviewModal';
import type { TIPPayload } from '@/tip/protocol';

import { ToolNode } from './nodes/ToolNode';
import { FileInputNode } from './nodes/FileInputNode';
import { OutputNode } from './nodes/OutputNode';
import { HumanReviewNode } from './nodes/HumanReviewNode';
import { TIPEdge } from './edges/TIPEdge';

import { usePipelineEngine } from '@/hooks/usePipelineEngine';
import { usePipelines } from '@/hooks/usePipelines';
import { TIPToolRegistry } from '@/tip/registry';
import { workerForTool } from '@/workers/instances';
import { ReviewSync } from '@/lib/review-sync';

import { PipelineDefinition } from '@/types/pipeline';

const nodeTypes = {
    tool: ToolNode,
    fileInput: FileInputNode,
    output: OutputNode,
    humanReview: HumanReviewNode,
};

const edgeTypes = {
    tip: TIPEdge,
};

const TIPConnectionLine = ({ fromX, fromY, toX, toY, connectionStatus }: ConnectionLineComponentProps) => {
    const isInvalid = connectionStatus === 'invalid';
    const color = isInvalid ? '#ef4444' : '#8b5cf6';

    return (
        <g>
            <path
                fill="none"
                stroke={color}
                strokeWidth={2}
                style={{
                    transition: 'stroke 0.2s ease',
                    strokeDasharray: isInvalid ? 'none' : '5,5',
                    animation: isInvalid ? 'none' : 'dashdraw 0.5s linear infinite',
                }}
                d={`M${fromX},${fromY} C${fromX + 50},${fromY} ${toX - 50},${toY} ${toX},${toY}`}
            />
            <circle cx={toX} cy={toY} fill="#fff" r={3} strokeWidth={1.5} stroke={color} />
        </g>
    );
};

function FlowCanvasBuilder() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const clipboard = useRef<{ nodes: any[], edges: any[] } | null>(null);
    const { screenToFlowPosition, fitView } = useReactFlow();

    const { nodes, edges, setNodes, setEdges, onNodesChange: baseOnNodesChange, onEdgesChange, onConnect: baseOnConnect, isValidConnection } = useFlowGraph();
    const { undo, redo, takeSnapshot, clearHistory, canUndo, canRedo } = useUndoRedo(nodes, edges, setNodes, setEdges);

    const onNodesChange = useCallback((changes: any) => {
        baseOnNodesChange(changes);
        // If it's a removal, take a snapshot after the state update
        if (changes.some((c: any) => c.type === 'remove')) {
            setTimeout(takeSnapshot, 0);
        }
    }, [baseOnNodesChange, takeSnapshot]);

    const onConnect = useCallback((params: any) => {
        baseOnConnect(params);
        setTimeout(takeSnapshot, 0);
    }, [baseOnConnect, takeSnapshot]);
    const { graphToPipeline } = useGraphSerializer();
    const { state, output, run, cancel, reset: resetEngine, isPaused, pause, resume } = usePipelineEngine();
    const { save, exportJson } = usePipelines();

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [interactionNodeId, setInteractionNodeId] = useState<string | null>(null);

    const hasRecovered = useRef(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

    const updateNodeData = useCallback((nodeId: string, partialData: any) => {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...partialData } } : n));
    }, [setNodes]);

    const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
    const [currentPipelineName, setCurrentPipelineName] = useState<string | null>(null);
    const [currentPipelineDescription, setCurrentPipelineDescription] = useState<string | null>(null);
    const [currentPipelineAuthor, setCurrentPipelineAuthor] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<File | TIPPayload | null>(null);

    useFlowEngineSync(nodes, edges, setNodes, setEdges, state, output, graphToPipeline);

    const onSelectionChange = useCallback((params: { nodes: Node[] }) => {
        if (params.nodes.length > 0) setSelectedNodeId(params.nodes[0].id);
        else setSelectedNodeId(null);
    }, [setSelectedNodeId]);

    const injectNodeCallbacks = useCallback((nds: Node[]) => {
        return nds.map(n => {
            if (n.type === 'tool' || n.type === 'humanReview') {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        onOpenInteraction: () => setInteractionNodeId(n.id),
                    }
                };
            }
            if (n.type === 'fileInput') {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        onFileSelect: (f: File | null) => updateNodeData(n.id, { file: f, status: 'idle' }),
                        onPreview: (f: any) => setPreviewFile(f),
                    }
                };
            }
            if (n.type === 'output') {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        onPreview: (p: any) => setPreviewFile(p),
                    }
                };
            }
            if (n.type === 'humanReview') {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        onOpenInteraction: () => setInteractionNodeId(n.id),
                    }
                };
            }
            return n;
        });
    }, [setInteractionNodeId, updateNodeData]);

    const serializeGraph = useCallback(() => {
        const cleanNodes = nodes.map(n => ({
            ...n,
            data: {
                ...n.data,
                file: undefined,
                previewFiles: undefined,
                interactionFiles: undefined,
                bundle: undefined,
                status: 'idle',
                error: undefined,
                durationMs: undefined,
                interactionDone: undefined,
                isPreviewing: undefined
            }
        }));

        const cleanEdges = edges.map(e => ({
            ...e,
            data: { ...e.data, isRunning: false, isInvalid: false }
        }));

        return { nodes: cleanNodes, edges: cleanEdges };
    }, [nodes, edges]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        if (!type) return;

        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const newNodeId = `node-${type}-${Date.now()}`;

        if (type === 'tool' || type === 'humanReview') {
            const toolId = event.dataTransfer.getData('application/toolId');
            const tool = TIPToolRegistry.get(toolId);
            if (!tool) return;
            const config = Object.fromEntries(tool.configSchema.fields.map(f => [f.key, f.default]));

            // Phase 2: Node-aware pre-warm — start booting the WASM runtime immediately
            // on node drop, before the user clicks Run. WorkerClient.init() is idempotent:
            // if idle pre-warm already started this resolves to the same in-flight promise.
            workerForTool(toolId)?.init().catch(() => {});

            setNodes(nds => nds.concat({
                id: newNodeId, type, position,
                data: {
                    toolId, config, status: 'idle',
                    // Inject INP callback immediately so Configure button works on first render
                    onOpenInteraction: () => setInteractionNodeId(newNodeId),
                }
            }));
            setTimeout(takeSnapshot, 0);
        } else {
            const newNode = { id: newNodeId, type, position, data: { status: 'idle', file: null } };
            setNodes((nds) => {
                const next = nds.concat(injectNodeCallbacks([newNode]));
                return next;
            });
            setTimeout(takeSnapshot, 0);
        }
    }, [screenToFlowPosition, setNodes, takeSnapshot, injectNodeCallbacks]);

    const clearIntermediateMemory = useCallback((nds: Node[]) => {
        // Blob URLs and file buffers take heavy memory; we clear them from intermediate preview state when running or resetting.
        return nds.map(n => {
            if (n.type === 'tool') {
                return { ...n, data: { ...n.data, status: 'idle', durationMs: 0, error: undefined, previewFiles: undefined } };
            }
            return { ...n, data: { ...n.data, status: 'idle', durationMs: 0, error: undefined, bundle: undefined } };
        });
    }, []);

    const onCopy = useCallback(() => {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length === 0) return;

        const selectedEdges = edges.filter(e =>
            selectedNodes.some(n => n.id === e.source) && selectedNodes.some(n => n.id === e.target)
        );
        clipboard.current = { nodes: JSON.parse(JSON.stringify(selectedNodes)), edges: JSON.parse(JSON.stringify(selectedEdges)) };
    }, [nodes, edges]);

    const onPaste = useCallback(() => {
        if (!clipboard.current) return;

        const idMap = new Map<string, string>();
        const offset = 40;

        const newNodes = clipboard.current.nodes
            .filter(n => n.type !== 'fileInput' && n.type !== 'output')
            .map(n => {
                const newId = `node-${n.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                idMap.set(n.id, newId);
                return {
                    ...n,
                    id: newId,
                    position: { x: n.position.x + offset, y: n.position.y + offset },
                    selected: true,
                };
            });

        const newEdges = clipboard.current.edges
            .filter(e => idMap.has(e.source) && idMap.has(e.target))
            .map(e => ({
                ...e,
                id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                source: idMap.get(e.source)!,
                target: idMap.get(e.target)!,
                selected: true,
            }));

        setNodes(nds => (nds.map(n => ({ ...n, selected: false })) as Node[]).concat(injectNodeCallbacks(newNodes)));
        setEdges(eds => eds.map(e => ({ ...e, selected: false })).concat(newEdges));
        setTimeout(takeSnapshot, 0);
    }, [injectNodeCallbacks, setNodes, setEdges, takeSnapshot]);

    const onDuplicate = useCallback(() => {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length === 0) return;

        const selectedEdges = edges.filter(e =>
            selectedNodes.some(n => n.id === e.source) && selectedNodes.some(n => n.id === e.target)
        );

        const idMap = new Map<string, string>();
        const offset = 40;

        const newNodes = selectedNodes
            .filter(n => n.type !== 'fileInput' && n.type !== 'output')
            .map(n => {
                const newId = `node-${n.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                idMap.set(n.id, newId);
                return {
                    ...n,
                    id: newId,
                    position: { x: n.position.x + offset, y: n.position.y + offset },
                    selected: true,
                };
            });

        const newEdges = selectedEdges
            .filter(e => idMap.has(e.source) && idMap.has(e.target))
            .map(e => ({
                ...e,
                id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                source: idMap.get(e.source)!,
                target: idMap.get(e.target)!,
                selected: true,
            }));

        setNodes(nds => (nds.map(n => ({ ...n, selected: false })) as Node[]).concat(injectNodeCallbacks(newNodes)));
        setEdges(eds => eds.map(e => ({ ...e, selected: false })).concat(newEdges));
        setTimeout(takeSnapshot, 0);
    }, [nodes, edges, injectNodeCallbacks, setNodes, setEdges, takeSnapshot]);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                onCopy();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                onPaste();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                onDuplicate();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [onCopy, onPaste, onDuplicate]);

    // ── Autosave ────────────────────────────────────────────────────────────────

    useEffect(() => {
        const timer = setTimeout(() => {
            const { nodes: cleanNodes, edges: cleanEdges } = serializeGraph();
            const draft = {
                nodes: cleanNodes,
                edges: cleanEdges,
                pipelineId: currentPipelineId,
                pipelineName: currentPipelineName
            };
            try {
                localStorage.setItem('toolbase:pipeline-draft', JSON.stringify(draft));
            } catch (e) {
                console.warn('[Autosave] Failed to write draft to localStorage', e);
            }
        }, 1200); // 1.2s debounce to avoid hammering LS during drag
        return () => clearTimeout(timer);
    }, [nodes, edges, currentPipelineId, currentPipelineName, serializeGraph]);

    // ── Recovery ────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (hasRecovered.current) return;
        hasRecovered.current = true;
        
        const raw = localStorage.getItem('toolbase:pipeline-draft');
        if (!raw) {
            setIsInitialLoading(false);
            return;
        }

        try {
            const draft = JSON.parse(raw);
            if (draft.nodes && draft.nodes.length > 0) {
                // We use baseSetNodes directly to avoid any callback-hell instability
                const restoredNodes = injectNodeCallbacks(draft.nodes);
                setNodes(() => restoredNodes);
                setEdges(() => draft.edges || []);
                
                if (draft.pipelineId) setCurrentPipelineId(draft.pipelineId);
                if (draft.pipelineName) setCurrentPipelineName(draft.pipelineName);
                
                // fitView handled by a one-off timeout
                setTimeout(() => {
                    fitView({ duration: 800, padding: 0.2 });
                    setIsInitialLoading(false);
                }, 400);
            } else {
                setIsInitialLoading(false);
            }
        } catch (e) {
            console.error('[Recovery] Failed to restore pipeline draft:', e);
            setIsInitialLoading(false);
        }
    }, [setNodes, setEdges, setCurrentPipelineId, setCurrentPipelineName, injectNodeCallbacks, fitView]);

    const handleRun = useCallback(async () => {
        setNodes(nds => clearIntermediateMemory(nds));
        setEdges(eds => eds.map(e => ({ ...e, data: { ...e.data, isRunning: false } })));
        resetEngine();
        const orderedSteps = graphToPipeline(nodes, edges);
        if (!orderedSteps) return;
        const fileNode = nodes.find(n => n.type === 'fileInput');
        const file = fileNode?.data.file;
        if (!file) return;
        await run(orderedSteps, file as File);
    }, [nodes, edges, graphToPipeline, run, resetEngine, setNodes, setEdges, clearIntermediateMemory]);

    const handleStop = useCallback(() => { cancel(); }, [cancel]);
    const handlePause = useCallback(() => { pause(); }, [pause]);
    const handleResume = useCallback(() => { resume(); }, [resume]);

    const handleReset = useCallback(() => {
        setNodes(injectNodeCallbacks([
            { id: 'node-file', type: 'fileInput', position: { x: 140, y: 240 }, data: { status: 'idle', file: null } },
            { id: 'node-out', type: 'output', position: { x: 680, y: 240 }, data: { status: 'idle' } }
        ]));
        setEdges([]);
        resetEngine();
        localStorage.removeItem('toolbase:pipeline-draft');
        setCurrentPipelineId(null);
        setCurrentPipelineName(null);
        setCurrentPipelineDescription(null);
        setCurrentPipelineAuthor(null);
        clearHistory();
    }, [setNodes, setEdges, resetEngine, clearHistory]);

    const onNodeDragStop = useCallback(() => {
        takeSnapshot();
    }, [takeSnapshot]);

    const onEdgeUpdateEnd = useCallback(() => {
        takeSnapshot();
    }, [takeSnapshot]);

    const handleSavePrimary = useCallback(() => {
        setIsSaveModalOpen(true);
    }, []);

    const performSave = useCallback((metadata: { name: string; description?: string; author?: string }) => {
        const orderedSteps = graphToPipeline(nodes, edges);

        const newId = currentPipelineId || crypto.randomUUID();

        const { nodes: cleanNodes, edges: cleanEdges } = serializeGraph();

        const def: PipelineDefinition = {
            id: newId,
            name: metadata.name,
            description: metadata.description,
            author: metadata.author,
            steps: orderedSteps || [],
            createdAt: new Date().toISOString(),
            tipVersion: '1.0',
            ui: { nodes: cleanNodes, edges: cleanEdges },
        };
        save(def);
        setCurrentPipelineId(newId);
        setCurrentPipelineName(metadata.name);
        setCurrentPipelineDescription(metadata.description || null);
        setCurrentPipelineAuthor(metadata.author || null);
        setIsSavedModalOpen(true);
    }, [nodes, edges, graphToPipeline, save, currentPipelineId, serializeGraph]);

    const { pipelineToGraph } = useGraphSerializer();

    const handleLoad = useCallback((pipeline: PipelineDefinition) => {
        try {
            setIsInitialLoading(true);
            if (pipeline.ui && pipeline.ui.nodes) {
                const loadedNodes = injectNodeCallbacks(pipeline.ui.nodes);
                setNodes(() => loadedNodes);
                setEdges(() => pipeline.ui!.edges || []);
                setCurrentPipelineId(pipeline.id);
                setCurrentPipelineName(pipeline.name);
                setCurrentPipelineDescription(pipeline.description || null);
                setCurrentPipelineAuthor(pipeline.author || null);
            } else {
                const { nodes: newNodes, edges: newEdges } = pipelineToGraph(pipeline);
                setNodes(() => newNodes);
                setEdges(() => newEdges);
                setIsInitialLoading(false);
            }
            setCurrentPipelineId(pipeline.id);
            setCurrentPipelineName(pipeline.name);
            setIsSavedModalOpen(false);

            // Center view after layout settles
            setTimeout(() => {
                fitView({ duration: 800, padding: 0.2 });
                setIsInitialLoading(false);
            }, 400);
        } catch (err) {
            console.error('Failed to load pipeline:', err);
            setIsInitialLoading(false);
        }
    }, [pipelineToGraph, setNodes, setEdges, injectNodeCallbacks, fitView]);

    const handleExport = useCallback(() => {
        const orderedSteps = graphToPipeline(nodes, edges);
        const { nodes: cleanNodes, edges: cleanEdges } = serializeGraph();


        const def: PipelineDefinition = {
            id: crypto.randomUUID(),
            name: `Pipeline ${new Date().toLocaleTimeString()}`,
            steps: orderedSteps || [],
            createdAt: new Date().toISOString(),
            tipVersion: '1.0',
            ui: { nodes: cleanNodes, edges: cleanEdges },
        };
        exportJson(def);
    }, [nodes, edges, graphToPipeline, exportJson]);

    const fileNode = nodes.find(n => n.type === 'fileInput');
    const outNode = nodes.find(n => n.type === 'output');
    const ordered = graphToPipeline(nodes, edges);
    const hasInvalidEdges = edges.some(e => e.data?.isInvalid);
    const canRun = !!fileNode?.data.file && !!outNode && !!ordered && ordered.length > 0 && !hasInvalidEdges;

    /**
     * Palette filter context — tells NodePalette which tools to highlight.
     * Priority: selected tool node > file in FileInputNode > no filter.
     */
    const paletteFilterContext = useMemo((): PaletteFilterContext => {
        // A tool node is selected → show tools that can consume what it produces
        if (selectedNode && selectedNode.type === 'tool') {
            const tool = TIPToolRegistry.get(selectedNode.data.toolId as string);
            if (tool && tool.produces.length > 0) {
                return { kind: 'node', produces: tool.produces };
            }
        }
        // FileInputNode has a file → show tools that consume that MIME type
        const uploadedFile = fileNode?.data.file as File | null;
        if (uploadedFile?.type) {
            return { kind: 'file', mimeType: uploadedFile.type };
        }
        return { kind: 'none' };
    }, [selectedNode?.id, selectedNode?.data?.toolId, (fileNode?.data?.file as any)?.type]);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: '#0b0b0d',
            overflow: 'hidden',
        }}
            ref={reactFlowWrapper}
        >
            {/* Strip React Flow's default white node wrapper background */}
            <style>{`
                .react-flow__node { background: transparent !important; border: none !important; border-radius: 0 !important; padding: 0 !important; }
                .react-flow__node.selected > div { outline: none !important; }
                .react-flow__node:focus { outline: none !important; }
                .react-flow__controls-button { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.1) !important; fill: #888 !important; }
                .react-flow__controls-button:hover { background: rgba(255,255,255,0.1) !important; fill: #ccc !important; }
                .react-flow__edge-path { stroke-width: 2.5; stroke: #9ca3af; transition: stroke 0.3s ease, stroke-width 0.2s ease; }
                .react-flow__edge.selected .react-flow__edge-path { stroke: #8b5cf6; stroke-width: 3.5; }
                .react-flow__handle { width: 10px; height: 10px; background: #333; border: 2px solid #000; transition: all 0.2s ease; }
                .react-flow__handle:hover { transform: scale(1.3); background: #8b5cf6; border-color: #fff; }
                
                .react-flow__handle-valid {
                    background: #4ade80 !important;
                    border-color: #fff !important;
                    box-shadow: 0 0 12px rgba(74, 222, 128, 0.6);
                    transform: scale(1.2);
                }
                .react-flow__handle-invalid {
                    background: #ef4444 !important;
                    border-color: #fff !important;
                    box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
                    transform: scale(0.9) rotate(45deg);
                }

                @keyframes dashdraw {
                    from { stroke-dashoffset: 10; }
                    to { stroke-dashoffset: 0; }
                }

                .react-flow__controls { background: rgba(12,12,14,0.9); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; overflow: hidden; backdrop-filter: blur(10px); }
            `}</style>
            {/* Floating toolbar at top-center */}
            <PipelineToolbar
                onRun={handleRun}
                onStop={handleStop}
                onPause={handlePause}
                onResume={handleResume}
                onReset={handleReset}
                onSave={handleSavePrimary}
                onLoad={() => setIsSavedModalOpen(true)}
                onExport={handleExport}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                isRunning={state.status === 'running'}
                isPaused={isPaused}
                canRun={canRun}
            />

            {isSavedModalOpen && (
                <SavedPipelinesModal
                    onClose={() => setIsSavedModalOpen(false)}
                    onLoad={handleLoad}
                />
            )}

            <SavePipelineModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                initialData={{
                    name: currentPipelineName || '',
                    description: currentPipelineDescription || '',
                    author: currentPipelineAuthor || ''
                }}
                onSave={performSave}
            />

            {/* Floating NodePalette on left */}
            <NodePalette filterContext={paletteFilterContext} />

            {/* INP: Interaction modal — shown when a tool node's Configure button is clicked */}
            {interactionNodeId && (() => {
                const interactionNode = nodes.find(n => n.id === interactionNodeId);
                const interactionTool = interactionNode?.data.toolId
                    ? TIPToolRegistry.get(interactionNode.data.toolId as string)
                    : null;
                if (!interactionTool?.interactable || !interactionTool.getInteractionComponent) return null;

                // Resolve seed files: collect outputs from all upstream nodes recursively.
                // We prefer data.previewFiles (from background execution), then data.interactionFiles, then data.file.
                const getUpstreamFilesRecursive = (nodeId: string): File[] => {
                    const parentEdges = edges.filter(e => e.target === nodeId);
                    const files: File[] = [];
                    for (const edge of parentEdges) {
                        const parentNode = nodes.find(n => n.id === edge.source);
                        if (!parentNode) continue;

                        const data = parentNode.data;
                        if (Array.isArray(data.previewFiles) && data.previewFiles.length > 0) {
                            files.push(...(data.previewFiles as File[]));
                            continue;
                        }
                        if (Array.isArray(data.interactionFiles) && data.interactionFiles.length > 0) {
                            files.push(...(data.interactionFiles as File[]));
                            continue;
                        }
                        if (data.file instanceof File) {
                            files.push(data.file);
                            continue;
                        }

                        // Recurse to find the inherited seed file from further upstream
                        files.push(...getUpstreamFilesRecursive(parentNode.id));
                    }
                    return files;
                };

                const upstreamFiles = getUpstreamFilesRecursive(interactionNodeId);
                let seedFiles: File[] = upstreamFiles;

                // SPECIAL CASE: Human Review during a LIVE RUN.
                // If ReviewSync has a pending bundle for this node, it means execution is paused 
                // exactly at this node. We must use THAT live data for the preview.
                if (interactionNode?.type === 'humanReview') {
                    const pendingInput = ReviewSync.getPendingInput(interactionNodeId);
                    if (pendingInput && pendingInput.payloads.length > 0) {
                        seedFiles = pendingInput.payloads.map(p => 
                            new File([p.data], p.meta.filename || 'review-file', { type: p.meta.mimeType as string })
                        );
                    }
                }

                if (seedFiles.length === 0) {
                    seedFiles = (interactionNode?.data.interactionFiles as File[] | undefined) ?? [];
                }

                return (
                    <InteractionModal
                        tool={interactionTool}
                        seedFiles={seedFiles}
                        config={(interactionNode?.data.config as Record<string, unknown>) ?? {}}
                        onConfirm={async (result) => {
                            // 1. If this is a Human Review node, always resolve via ReviewSync.
                            //    We don't want to fall through to normal tool configuration logic.
                            if (interactionNode?.type === 'humanReview') {
                                ReviewSync.resolveReview(interactionNode.id, true);
                                setInteractionNodeId(null);
                                return;
                            }

                            const hasUpstream = edges.some(e => e.target === interactionNodeId);

                            // Standalone mode: user browsed files directly in the modal.
                            // Auto-create a FileInputNode for each confirmed file and wire them up.
                            if (!hasUpstream && result.files.length > 0) {
                                const mx = interactionNode?.position?.x ?? 500;
                                const my = interactionNode?.position?.y ?? 300;
                                const gap = 170;
                                const totalH = (result.files.length - 1) * gap;

                                const fileNodes: Node[] = result.files.map((file, i) => {
                                    const nid = `file-input-auto-${Date.now()}-${i}`;
                                    return {
                                        id: nid,
                                        type: 'fileInput',
                                        position: { x: mx - 290, y: my - totalH / 2 + i * gap },
                                        data: {
                                            file,
                                            onFileSelect: (f: File | null) => updateNodeData(nid, { file: f }),
                                        },
                                    };
                                });

                                const fileEdges: Edge[] = fileNodes.map(n => ({
                                    id: `edge-${n.id}-${interactionNodeId}`,
                                    source: n.id,
                                    target: interactionNodeId,
                                    type: 'tip',
                                    data: { isRunning: false },
                                }));

                                setNodes(prev => [...prev, ...fileNodes]);
                                setEdges(prev => [...prev, ...fileEdges]);
                            }

                            const currentConfig = (interactionNode?.data.config as Record<string, unknown>) ?? {};
                            const newConfig = { ...currentConfig, ...result.config } as any;

                            updateNodeData(interactionNodeId, {
                                interactionFiles: result.files,
                                interactionDone: true,
                                isPreviewing: true, // Show loading spinner
                                ...(result.config ? { config: newConfig } : {}),
                            });

                            // Close modal immediately so user isn't blocked by execution
                            setInteractionNodeId(null);

                            // Run the executor in the background to generate preview data for downstream nodes
                            if (interactionTool && result.files.length > 0) {
                                try {
                                    const { bundleFromFiles } = await import('@/tip/bundle');
                                    const inputBundle = bundleFromFiles(result.files);

                                    const dummyHooks = {
                                        onProgress: () => { },
                                        onLog: () => { },
                                        signal: new AbortController().signal
                                    };

                                    const outputBundle = await interactionTool.invoke(inputBundle, newConfig, dummyHooks);

                                    const previewFiles = outputBundle.payloads.map(p =>
                                        new File([p.data], p.meta.filename || 'preview', { type: p.meta.mimeType as string })
                                    );

                                    updateNodeData(interactionNodeId, {
                                        isPreviewing: false,
                                        previewFiles
                                    });
                                } catch (err) {
                                    console.error("Background preview execution failed:", err);
                                    updateNodeData(interactionNodeId, { isPreviewing: false });
                                }
                            } else {
                                updateNodeData(interactionNodeId, { isPreviewing: false });
                            }
                        }}
                        onCancel={() => {
                            // 1. If this is a Human Review node, always resolve via ReviewSync (as rejection).
                            if (interactionNode?.type === 'humanReview') {
                                ReviewSync.resolveReview(interactionNode.id, false);
                                setInteractionNodeId(null);
                                return;
                            }
                            setInteractionNodeId(null);
                        }}
                    />
                );
            })()}

            {/* Flow canvas */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                connectionLineComponent={TIPConnectionLine}
                isValidConnection={isValidConnection}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onSelectionChange={onSelectionChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes as any}
                connectionMode={ConnectionMode.Loose}
                defaultEdgeOptions={{ type: 'tip', animated: false }}
                snapToGrid={true}
                snapGrid={[20, 20]}
                minZoom={0.15}
                maxZoom={2.5}
                deleteKeyCode={['Backspace', 'Delete']}
                multiSelectionKeyCode="Shift"
                selectionOnDrag
                style={{ background: '#0b0b0d' }}
            >
                {/* Dark dot grid background */}
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={28}
                    size={1}
                    color="rgba(255,255,255,0.07)"
                />
                <Controls
                    style={{
                        background: 'rgba(14,14,16,0.9)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                        bottom: 80,
                        left: 16,
                    }}
                />
                <MiniMap
                    zoomable
                    pannable
                    style={{
                        background: 'rgba(14,14,16,0.9)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                        bottom: 16,
                        right: 296,
                    }}
                    nodeColor={(n) => {
                        if (n.type === 'fileInput') return '#4ade80';
                        if (n.type === 'output') return '#34d399';
                        return '#8b5cf6';
                    }}
                    maskColor="rgba(0,0,0,0.6)"
                />
            </ReactFlow>

            {/* Floating InspectorPanel on right */}
            <InspectorPanel selectedNode={selectedNode} updateNodeData={updateNodeData} />
            {/* Loading Overlay */}
            {isInitialLoading && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0b0b0d',
                    transition: 'opacity 0.5s ease',
                }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        border: '2px solid rgba(139, 92, 246, 0.1)',
                        borderTopColor: '#8b5cf6',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        marginBottom: 16,
                    }} />
                    <div style={{ color: '#8b5cf6', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}>
                        Warming Pipeline...
                    </div>
                    <style>{`
                        @keyframes spin { to { transform: rotate(360deg); } }
                    `}</style>
                </div>
            )}
            {/* Global File Preview Modal */}
            {previewFile && (
                <FilePreviewModal
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </div>
    );
}

export function FlowCanvas() {
    return (
        <ReactFlowProvider>
            <FlowCanvasBuilder />
        </ReactFlowProvider>
    );
}
