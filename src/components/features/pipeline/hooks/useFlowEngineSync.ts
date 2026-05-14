import { useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { PipelineEngineState, PipelineStep } from '@/types/pipeline';
import type { TIPBundle } from '@/tip/protocol';

export function useFlowEngineSync(
    nodes: Node[],
    edges: Edge[],
    setNodes: (update: (nds: Node[]) => Node[]) => void,
    setEdges: (update: (eds: Edge[]) => Edge[]) => void,
    state: PipelineEngineState,
    output: TIPBundle | null,
    graphToPipeline: (nodes: Node[], edges: Edge[]) => PipelineStep[] | null
) {
    /**
     * Track the last output bundle we have already synced to the output node.
     * This prevents the infinite loop caused by `n.data.bundle === output`
     * always being false when `output` is a new object reference per render.
     * Using a ref means we compare by identity across renders without adding
     * `output` as a reactive dependency that retriggers the effect.
     */
    const syncedOutputRef = useRef<TIPBundle | null>(null);

    // Sync engine state to canvas
    useEffect(() => {
        if (state.status === 'idle') return;
        const orderedSteps = graphToPipeline(nodes, edges);
        if (!orderedSteps) return;

        setNodes(nds => {
            let changed = false;
            const newNodes = nds.map(n => {
                if (n.type === 'fileInput') {
                    const s = state.status === 'running' ? 'running' : state.status === 'complete' ? 'complete' : 'idle';
                    if (n.data.status === s) return n;
                    changed = true;
                    return { ...n, data: { ...n.data, status: s } };
                }
                if (n.type === 'tool' || n.type === 'humanReview') {
                    const stepIndex = orderedSteps.findIndex(s => s.id === n.id);
                    if (stepIndex >= 0 && state.steps[stepIndex]) {
                        const ss = state.steps[stepIndex];
                        let nextStatus = 'idle';
                        if (ss.status === 'running') nextStatus = 'running';
                        if (ss.status === 'paused') nextStatus = 'paused';
                        if (ss.status === 'complete') nextStatus = 'complete';
                        if (ss.status === 'error') nextStatus = 'error';

                        if (n.data.status === nextStatus && n.data.durationMs === ss.durationMs && n.data.error === ss.error) {
                             return n;
                        }
                        changed = true;
                        return { ...n, data: { ...n.data, status: nextStatus, durationMs: ss.durationMs, error: ss.error } };
                    }
                }
                if (n.type === 'output') {
                    // Primary signal: if we HAVE an output, the node should be in complete state
                    if (output) {
                        if (n.data.bundle === output && n.data.status === 'complete') return n;
                        changed = true;
                        const totalDurationMs = state.steps.reduce((acc, step) => acc + (step.durationMs || 0), 0);
                        return { ...n, data: { ...n.data, status: 'complete', bundle: output, totalDurationMs } };
                    }
                    
                    // Secondary signal: if engine is running, show running status
                    if (state.status === 'running') {
                         if (n.data.status === 'running') return n;
                         changed = true;
                         return { ...n, data: { ...n.data, status: 'running', bundle: null } };
                    }

                    // Default: idle
                    if (state.status === 'idle' || state.status === 'cancelled' || state.status === 'error') {
                        if (n.data.status === 'idle' && !n.data.bundle) return n;
                        changed = true;
                        return { ...n, data: { ...n.data, status: 'idle', bundle: null } };
                    }
                }
                return n;
            });
            return changed ? newNodes : nds;
        });

        // Update the sync ref after the update has been queued
        if (state.status === 'complete' && output) {
            syncedOutputRef.current = output;
        } else if (state.status === 'running') {
            syncedOutputRef.current = null;
        }

        setEdges(eds => {
            const isDone = state.status === 'complete' || state.status === 'cancelled' || state.status === 'error' || state.status === 'paused';
            if (isDone) {
                if (eds.every(e => !e.data?.isRunning)) return eds;
                return eds.map(e => ({ ...e, data: { ...e.data, isRunning: false } }));
            }
            let runningEdgeId = '';
            const runningStepIndex = state.steps.findIndex(s => s.status === 'running');
            if (runningStepIndex === -1 && state.status === 'running') {
                const fileNodeId = nodes.find(n => n.type === 'fileInput')?.id;
                runningEdgeId = eds.find(edge => edge.source === fileNodeId)?.id || '';
            } else if (runningStepIndex >= 0) {
                const runningStepId = orderedSteps[runningStepIndex]?.id;
                runningEdgeId = eds.find(edge => edge.source === runningStepId)?.id || '';
            }
            
            const hasChange = eds.some(e => (e.id === runningEdgeId) !== !!e.data?.isRunning);
            if (!hasChange) return eds;

            return eds.map(e => ({ ...e, data: { ...e.data, isRunning: e.id === runningEdgeId } }));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, output, setNodes, setEdges, graphToPipeline]);
}
