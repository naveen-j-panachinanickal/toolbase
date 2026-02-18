import { NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import type { NodeData } from '@/types/open-draw.types';

// --- Types ---
interface CustomNodeProps extends NodeProps {
    data: NodeData;
}

// --- Editable Label Helper ---
export function EditableLabel({ id, label, className = '', style = {} }: { id: string, label: string, className?: string, style?: React.CSSProperties }) {
    const { updateNodeData } = useReactFlow();
    const [text, setText] = useState(label);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setText(label);
    }, [label]);

    const onChange = (evt: ChangeEvent<HTMLTextAreaElement>) => {
        setText(evt.target.value);
    };

    const onBlur = () => {
        setIsEditing(false);
        updateNodeData(id, { label: text });
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    if (isEditing) {
        return (
            <textarea
                value={text}
                onChange={onChange}
                onBlur={onBlur}
                autoFocus
                style={style}
                className={`w-full h-full bg-transparent resize-none outline-none border-none text-center font-medium placeholder-gray-400 overflow-hidden flex items-center justify-center ${className}`}
                spellCheck={false}
                onKeyDown={(e) => e.stopPropagation()}
            />
        );
    }

    return (
        <div
            onClick={handleClick}
            style={style}
            className={`w-full h-full flex items-center justify-center text-center font-medium whitespace-pre-wrap break-words cursor-text ${className}`}
        >
            {text || <span className="text-gray-400 opacity-50">Label</span>}
        </div>
    );
}

// --- Style Helper ---
export function useNodeStyle(data: NodeData, defaultBg: string = 'white') {
    return useMemo(() => {
        const baseStyle: React.CSSProperties = {
            borderColor: data.borderColor,
            borderWidth: data.borderWidth ? `${data.borderWidth}px` : undefined,
            color: data.textColor,
            fontSize: data.fontSize ? `${data.fontSize}px` : undefined,
            opacity: typeof data.opacity === 'number' ? data.opacity / 100 : undefined,
        };

        let bg = data.backgroundColor || defaultBg;

        if (data.glass) {
            // Simple glass effect approximation
            baseStyle.backdropFilter = 'blur(8px)';
            baseStyle.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // Override bg for glass
            baseStyle.border = '1px solid rgba(255, 255, 255, 0.3)';
        } else {
            baseStyle.backgroundColor = bg;
        }

        if (data.shadow) {
            baseStyle.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        }

        if (data.gradient) {
            baseStyle.backgroundImage = `linear-gradient(135deg, ${bg} 0%, #ffffff 100%)`;
            if (data.backgroundColor === '#ffffff') {
                baseStyle.backgroundImage = `linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)`;
            }
        }

        if (data.borderRadius && data.borderRadius > 0) {
            baseStyle.borderRadius = `${data.borderRadius}px`;
        }

        return baseStyle;
    }, [data, defaultBg]);
}

// --- Rectangle ---
export function RectangleNode({ id, selected, data }: CustomNodeProps) {
    const style = useNodeStyle(data);

    return (
        <>
            <NodeResizer minWidth={50} minHeight={40} isVisible={selected} lineClassName="border-blue-500" handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded" />
            <BaseNode selected={selected} contentClassName="!shadow-none w-full h-full">
                <div
                    className="w-full h-full flex items-center justify-center p-2 rounded-lg transition-colors"
                    style={{
                        backgroundColor: style.backgroundColor,
                        border: `${style.borderWidth || '1px'} solid ${style.borderColor || 'var(--border-color, #e5e7eb)'}`,
                        color: style.color
                    }}
                >
                    <EditableLabel id={id} label={String(data.label ?? 'Process')} style={{ fontSize: style.fontSize, color: style.color }} />
                </div>
            </BaseNode>
        </>
    );
}

// --- Circle ---
export function CircleNode({ id, selected, data }: CustomNodeProps) {
    const style = useNodeStyle(data);

    return (
        <>
            <NodeResizer minWidth={50} minHeight={50} isVisible={selected} lineClassName="border-blue-500" handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded" />
            <BaseNode selected={selected} contentClassName="!shadow-none w-full h-full">
                <div
                    className="w-full h-full flex items-center justify-center p-4 rounded-full transition-colors"
                    style={{
                        backgroundColor: style.backgroundColor,
                        border: `${style.borderWidth || '1px'} solid ${style.borderColor || 'var(--border-color, #e5e7eb)'}`,
                        color: style.color
                    }}
                >
                    <EditableLabel id={id} label={String(data.label ?? 'Start/End')} style={{ fontSize: style.fontSize, color: style.color }} />
                </div>
            </BaseNode>
        </>
    );
}

// --- Diamond ---
export function DiamondNode({ id, selected, data }: CustomNodeProps) {
    const style = useNodeStyle(data);

    // Using SVG for better coloring support than CSS rotate
    return (
        <>
            <NodeResizer minWidth={50} minHeight={50} isVisible={selected} lineClassName="border-blue-500" handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded" />
            <BaseNode selected={selected} contentClassName="!bg-transparent !shadow-none w-full h-full">
                <div className="w-full h-full relative flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon
                            points="50,0 100,50 50,100 0,50"
                            className="transition-colors"
                            fill={String(style.backgroundColor)}
                            stroke={style.borderColor || 'var(--border-color, #e5e7eb)'}
                            strokeWidth={data.borderWidth || 1}
                        />
                    </svg>
                    <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
                        <EditableLabel id={id} label={String(data.label ?? 'Decision')} style={{ fontSize: style.fontSize, color: style.color }} />
                    </div>
                </div>
            </BaseNode>
        </>
    );
}

// --- Cylinder (Database) ---
export function CylinderNode({ id, selected, data }: CustomNodeProps) {
    const style = useNodeStyle(data);

    return (
        <>
            <NodeResizer minWidth={50} minHeight={60} isVisible={selected} lineClassName="border-blue-500" handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded" />
            <BaseNode selected={selected} contentClassName="!bg-transparent !shadow-none w-full h-full">
                <div className="w-full h-full relative flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path
                            d="M0,15 Q50,0 100,15 L100,85 Q50,100 0,85 Z"
                            fill={String(style.backgroundColor)}
                            stroke={style.borderColor || 'var(--border-color, #e5e7eb)'}
                            strokeWidth={data.borderWidth || 1}
                        />
                        <ellipse cx="50" cy="15" rx="50" ry="15"
                            fill={String(style.backgroundColor)}
                            stroke={style.borderColor || 'var(--border-color, #e5e7eb)'}
                            strokeWidth={data.borderWidth || 1}
                        />
                    </svg>
                    <div className="relative z-10 w-full h-full flex items-center justify-center pt-8 p-4">
                        <EditableLabel id={id} label={String(data.label ?? 'Database')} style={{ fontSize: style.fontSize, color: style.color }} />
                    </div>
                </div>
            </BaseNode>
        </>
    );
}

// --- Cloud ---
export function CloudNode({ id, selected, data }: CustomNodeProps) {
    const style = useNodeStyle(data);

    return (
        <>
            <NodeResizer minWidth={80} minHeight={50} isVisible={selected} lineClassName="border-blue-500" handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded" />
            <BaseNode selected={selected} contentClassName="!bg-transparent !shadow-none w-full h-full">
                <div className="w-full h-full relative flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path
                            d="M25,60 Q10,60 10,45 Q10,30 25,30 Q30,10 50,10 Q70,10 75,30 Q90,30 90,45 Q90,60 75,60 Q70,80 50,80 Q30,80 25,60 Z"
                            fill={String(style.backgroundColor)}
                            stroke={style.borderColor || 'var(--border-color, #e5e7eb)'}
                            strokeWidth={data.borderWidth || 1}
                        />
                    </svg>
                    <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                        <EditableLabel id={id} label={String(data.label ?? 'Cloud')} style={{ fontSize: style.fontSize, color: style.color }} />
                    </div>
                </div>
            </BaseNode>
        </>
    );
}

// --- Document ---
export function DocumentNode({ id, selected, data }: CustomNodeProps) {
    const style = useNodeStyle(data);

    return (
        <>
            <NodeResizer minWidth={60} minHeight={80} isVisible={selected} lineClassName="border-blue-500" handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded" />
            <BaseNode selected={selected} contentClassName="!bg-transparent !shadow-none w-full h-full">
                <div className="w-full h-full relative flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path
                            d="M0,0 L100,0 L100,80 Q75,100 50,80 Q25,60 0,80 Z"
                            fill={String(style.backgroundColor)}
                            stroke={style.borderColor || 'var(--border-color, #e5e7eb)'}
                            strokeWidth={data.borderWidth || 1}
                        />
                    </svg>
                    <div className="relative z-10 w-full h-full flex items-center justify-center p-4 pb-8">
                        <EditableLabel id={id} label={String(data.label ?? 'Document')} style={{ fontSize: style.fontSize, color: style.color }} />
                    </div>
                </div>
            </BaseNode>
        </>
    );
}

// --- Parallelogram (Input/Output) ---
export function ParallelogramNode({ id, selected, data }: CustomNodeProps) {
    const style = useNodeStyle(data);

    return (
        <>
            <NodeResizer minWidth={80} minHeight={40} isVisible={selected} lineClassName="border-blue-500" handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded" />
            <BaseNode selected={selected} contentClassName="!bg-transparent !shadow-none w-full h-full">
                <div className="w-full h-full relative flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon
                            points="20,0 100,0 80,100 0,100"
                            fill={String(style.backgroundColor)}
                            stroke={style.borderColor || 'var(--border-color, #e5e7eb)'}
                            strokeWidth={data.borderWidth || 1}
                        />
                    </svg>
                    <div className="relative z-10 w-full h-full flex items-center justify-center p-4 pl-8 pr-8">
                        <EditableLabel id={id} label={String(data.label ?? 'Input/Output')} style={{ fontSize: style.fontSize, color: style.color }} />
                    </div>
                </div>
            </BaseNode>
        </>
    );
}

// --- Actor (User) ---
export function ActorNode({ id, selected, data }: CustomNodeProps) {
    const style = useNodeStyle(data);

    return (
        <>
            <NodeResizer minWidth={40} minHeight={80} isVisible={selected} lineClassName="border-blue-500" handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded" />
            <BaseNode selected={selected} contentClassName="!bg-transparent !shadow-none w-full h-full">
                <div className="w-full h-full relative flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Head */}
                        <circle cx="50" cy="15" r="15"
                            fill={String(style.backgroundColor)}
                            stroke={style.borderColor || 'var(--border-color, #e5e7eb)'}
                            strokeWidth={data.borderWidth || 1}
                        />
                        {/* Body */}
                        <line x1="50" y1="30" x2="50" y2="70" stroke={style.borderColor || 'var(--border-color, #e5e7eb)'} strokeWidth="2" />
                        {/* Arms */}
                        <line x1="20" y1="45" x2="80" y2="45" stroke={style.borderColor || 'var(--border-color, #e5e7eb)'} strokeWidth="2" />
                        {/* Legs */}
                        <line x1="50" y1="70" x2="20" y2="100" stroke={style.borderColor || 'var(--border-color, #e5e7eb)'} strokeWidth="2" />
                        <line x1="50" y1="70" x2="80" y2="100" stroke={style.borderColor || 'var(--border-color, #e5e7eb)'} strokeWidth="2" />
                    </svg>
                    <div className="absolute -bottom-8 w-[200%] text-center">
                        <EditableLabel id={id} label={String(data.label ?? 'User')} style={{ fontSize: style.fontSize, color: style.color }} />
                    </div>
                </div>
            </BaseNode>
        </>
    );
}

// --- Triangle (Merge/Extract) ---
export function TriangleNode({ id, selected, data }: CustomNodeProps) {
    const style = useNodeStyle(data);

    return (
        <>
            <NodeResizer minWidth={50} minHeight={50} isVisible={selected} lineClassName="border-blue-500" handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded" />
            <BaseNode selected={selected} contentClassName="!bg-transparent !shadow-none w-full h-full">
                <div className="w-full h-full relative flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon
                            points="50,0 100,100 0,100"
                            fill={String(style.backgroundColor)}
                            stroke={style.borderColor || 'var(--border-color, #e5e7eb)'}
                            strokeWidth={data.borderWidth || 1}
                        />
                    </svg>
                    <div className="relative z-10 w-full h-full flex items-center justify-center p-4 pt-10">
                        <EditableLabel id={id} label={String(data.label ?? 'Merge')} style={{ fontSize: style.fontSize, color: style.color }} />
                    </div>
                </div>
            </BaseNode>
        </>
    );
}

// --- Text ---
export function TextNode({ id, selected, data }: CustomNodeProps) {
    const style = useNodeStyle(data, 'transparent');

    return (
        <>
            <NodeResizer minWidth={50} minHeight={30} isVisible={selected} lineClassName="border-blue-500" handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded" />
            <BaseNode selected={selected} contentClassName="!bg-transparent !shadow-none !p-0 w-full h-full">
                <div
                    className="w-full h-full p-2 border border-transparent rounded transition-colors"
                >
                    <EditableLabel
                        id={id}
                        label={String(data.label ?? 'Text')}
                        style={{ fontSize: style.fontSize, color: style.color }}
                        className="text-left font-bold"
                    />
                </div>
            </BaseNode>
        </>
    );
}
