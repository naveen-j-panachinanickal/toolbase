import { BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from '@xyflow/react';

/**
 * TIPEdge — Custom animated edge for the pipeline canvas.
 * Shows animated dashes when running, red with label when incompatible types.
 */
export function TIPEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const isInvalid = data?.isInvalid;
    const isRunning = data?.isRunning;

    const strokeColor = isInvalid
        ? '#ef4444'
        : selected
            ? '#818cf8'
            : '#374151';

    const edgeStyle = {
        ...style,
        strokeWidth: selected ? 2.5 : 1.5,
        stroke: strokeColor,
        strokeDasharray: isRunning ? '6 4' : undefined,
        filter: isRunning
            ? 'drop-shadow(0 0 4px rgba(99,102,241,0.7))'
            : selected
                ? 'drop-shadow(0 0 3px rgba(129,140,248,0.5))'
                : undefined,
        animation: isRunning ? 'tipEdgeDash 0.5s linear infinite' : undefined,
    };

    return (
        <>
            <style>{`
                @keyframes tipEdgeDash {
                    from { stroke-dashoffset: 0; }
                    to   { stroke-dashoffset: -20; }
                }
            `}</style>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={edgeStyle}
                id={id}
            />
            {isInvalid && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                            backgroundColor: '#450a0a',
                            color: '#fca5a5',
                            border: '1px solid rgba(239,68,68,0.4)',
                            padding: '2px 8px',
                            borderRadius: 5,
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            textTransform: 'uppercase',
                        }}
                        className="nodrag nopan"
                    >
                        Type Mismatch
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
