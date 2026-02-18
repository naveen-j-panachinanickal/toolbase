/**
 * OpenDraw Zod Schemas
 * Strictly typed message schemas for the TS <-> Python bridge.
 */
import { z } from 'zod';

// --- Core Graph Types ---

// --- Core Graph Types ---

export const NodeDataSchema = z.object({
    label: z.string().default('Node'),
    // Styling
    backgroundColor: z.string().optional(),
    borderColor: z.string().optional(),
    borderWidth: z.number().optional(),
    borderStyle: z.string().optional(), // 'solid', 'dashed', 'dotted'
    textColor: z.string().optional(),
    fontSize: z.number().optional(),
    icon: z.string().optional(),
    iconType: z.enum(['lucide', 'react-icon']).optional(),
    // Advanced Styling
    opacity: z.number().optional(),
    borderRadius: z.number().optional(),
    shadow: z.boolean().optional(),
    glass: z.boolean().optional(),
    sketch: z.boolean().optional(),
    gradient: z.boolean().optional(),
    imageUrl: z.string().optional(),
    imageMode: z.enum(['cover', 'contain', 'stretch']).optional(),
    imageZoom: z.number().optional(),
    imageX: z.number().optional(),
    imageY: z.number().optional(),
});

export const PositionSchema = z.object({
    x: z.number(),
    y: z.number(),
});

export const GraphNodeSchema = z.object({
    id: z.string(),
    type: z.enum([
        'rectangle',
        'circle',
        'diamond',
        'text',
        // New Shapes
        'cylinder',
        'cloud',
        'actor',
        'document',
        'parallelogram',
        'triangle'
    ]).default('rectangle'),
    position: PositionSchema,
    data: NodeDataSchema,
    width: z.number().optional(),
    height: z.number().optional(),
    parentId: z.string().optional(), // For grouping
    zIndex: z.number().optional(),
});

export const GraphEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
    type: z.enum(['smoothstep', 'straight', 'bezier']).default('smoothstep'),
    animated: z.boolean().default(false),
    label: z.string().optional(),
    // Edge Styling
    style: z.object({
        stroke: z.string().optional(),
        strokeWidth: z.number().optional(),
    }).optional(),
});

export const GraphSchema = z.object({
    nodes: z.array(GraphNodeSchema),
    edges: z.array(GraphEdgeSchema),
    viewport: z.object({
        x: z.number(),
        y: z.number(),
        zoom: z.number(),
    }).optional(),
});

// --- Worker Message Types ---

// Commands sent TO the worker
export const WorkerCommandSchema = z.discriminatedUnion('type', [
    // Initialize the worker
    z.object({
        type: z.literal('INIT'),
        id: z.string(),
    }),

    // Request auto-layout
    z.object({
        type: z.literal('AUTO_LAYOUT'),
        id: z.string(),
        data: z.object({
            graph: GraphSchema,
            algorithm: z.enum(['hierarchical', 'circular', 'spring']),
            options: z.record(z.string(), z.any()).optional(),
        }),
    }),

    // Analyze graph for cycles
    z.object({
        type: z.literal('DETECT_CYCLES'),
        id: z.string(),
        data: z.object({
            graph: GraphSchema,
        }),
    }),

    // Find shortest path between nodes
    z.object({
        type: z.literal('SHORTEST_PATH'),
        id: z.string(),
        data: z.object({
            graph: GraphSchema,
            sourceId: z.string(),
            targetId: z.string(),
        }),
    }),

    // Parse Mermaid syntax
    z.object({
        type: z.literal('PARSE_MERMAID'),
        id: z.string(),
        data: z.object({
            content: z.string(),
        }),
    }),

    // Parse XML (Visio-like)
    z.object({
        type: z.literal('PARSE_XML'),
        id: z.string(),
        data: z.object({
            content: z.string(),
        }),
    }),
]);

// Responses FROM the worker
export const WorkerResponseSchema = z.discriminatedUnion('type', [
    // Worker is ready
    z.object({
        type: z.literal('READY'),
    }),

    // Layout result
    z.object({
        type: z.literal('AUTO_LAYOUT_RESULT'),
        id: z.string(),
        data: z.object({
            nodes: z.array(GraphNodeSchema),
        }),
    }),

    // Cycle detection result
    z.object({
        type: z.literal('DETECT_CYCLES_RESULT'),
        id: z.string(),
        data: z.object({
            hasCycles: z.boolean(),
            cycles: z.array(z.array(z.string())), // Array of node ID arrays
        }),
    }),

    // Shortest path result
    z.object({
        type: z.literal('SHORTEST_PATH_RESULT'),
        id: z.string(),
        data: z.object({
            path: z.array(z.string()).nullable(), // Node IDs or null if no path
            length: z.number().nullable(),
        }),
    }),

    // Parse result (Mermaid or XML)
    z.object({
        type: z.literal('PARSE_RESULT'),
        id: z.string(),
        data: z.object({
            graph: GraphSchema,
        }),
    }),

    // Error response
    z.object({
        type: z.literal('ERROR'),
        id: z.string().optional(),
        error: z.string(),
    }),
]);

// --- Type Exports ---
export type NodeData = z.infer<typeof NodeDataSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;
export type Graph = z.infer<typeof GraphSchema>;
export type WorkerCommand = z.infer<typeof WorkerCommandSchema>;
export type WorkerResponse = z.infer<typeof WorkerResponseSchema>;

export interface ShapeDefinition {
    type: string;
    label: string;
    path?: string; // Single path
    paths?: { d: string; fill?: string; stroke?: string }[]; // Multiple paths
    viewBox?: string;
    width?: number; // Default width
    height?: number; // Default height
    icon?: React.ElementType; // For the toolbar
}

// --- Helper to create unique message IDs ---
export function createMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
