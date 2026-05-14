import { useCallback, useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import type { PipelineStep, PipelineDefinition } from '@/types/pipeline';
import { TIPToolRegistry } from '@/tip/registry';

function getTypeColor(type?: string): string {
    if (!type) return '#9ca3af';
    if (type === 'application/pdf') return '#ef4444';
    if (type.startsWith('image/')) return '#a855f7';
    if (type.startsWith('text/')) return '#3b82f6';
    if (type === 'application/json') return '#eab308';
    if (type === 'application/zip') return '#f97316';
    return '#9ca3af';
}

export function useGraphSerializer() {
    
    const graphToPipeline = useCallback((nodes: Node[], edges: Edge[]): PipelineStep[] | null => {
        // 1. Find the File Input node
        const fileNode = nodes.find(n => n.type === 'fileInput');
        if (!fileNode) return null;

        const steps: PipelineStep[] = [];
        let currentNodeId: string | null = fileNode.id;

        // 2. Follow edges left→right
        const visited = new Set<string>();

        while (currentNodeId) {
            if (visited.has(currentNodeId)) {
                // cycle detected
                break;
            }
            visited.add(currentNodeId);

            const nextEdge = edges.find(e => e.source === currentNodeId);
            if (!nextEdge) break;

            const nextNode = nodes.find(n => n.id === nextEdge.target);
            if (!nextNode) break;

            if (nextNode.type === 'output') {
                break; // We're done
            }

            if (nextNode.type === 'tool' || nextNode.type === 'humanReview') {
                steps.push({
                    id: nextNode.id,
                    toolId: nextNode.data.toolId as string,
                    config: {
                        ...(nextNode.data.config as Record<string, any> || {}),
                        __nodeId: nextNode.id,
                    },
                });
            }

            currentNodeId = nextNode.id;
        }

        return steps;
    }, []);

    const pipelineToGraph = useCallback((pipeline: PipelineDefinition): { nodes: Node[], edges: Edge[] } => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // File Node
        let prevId = 'node-file-input';
        nodes.push({
            id: prevId,
            type: 'fileInput',
            position: { x: 50, y: 200 },
            data: { status: 'idle' }
        });

        let currentX = 350;

        pipeline.steps.forEach((step, i) => {
            const tool = TIPToolRegistry.get(step.toolId);
            if (!tool) return;

            const nodeId = `node-tool-${step.id || i}`;
            
            nodes.push({
                id: nodeId,
                type: 'tool',
                position: { x: currentX, y: 200 },
                data: {
                    toolId: step.toolId,
                    config: step.config,
                    status: 'idle'
                }
            });

            edges.push({
                id: `edge-${prevId}-${nodeId}`,
                source: prevId,
                target: nodeId,
                type: 'tip',
                data: { color: getTypeColor(tool.consumes[0]) } 
            });

            prevId = nodeId;
            currentX += 300;
        });

        // Output Node
        const outId = 'node-output';
        nodes.push({
            id: outId,
            type: 'output',
            position: { x: currentX, y: 200 },
            data: { status: 'idle' }
        });

        edges.push({
            id: `edge-${prevId}-${outId}`,
            source: prevId,
            target: outId,
            type: 'tip',
            data: { color: '#9ca3af' }
        });

        return { nodes, edges };
    }, []);

    return useMemo(() => ({ graphToPipeline, pipelineToGraph }), [graphToPipeline, pipelineToGraph]);
}
