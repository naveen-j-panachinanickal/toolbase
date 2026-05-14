import React from 'react';
import Image from 'next/image';
import { TIPToolRegistry } from '@/tip/registry';
import type { Node } from '@xyflow/react';
import { SlidersHorizontal, Info, AlertOctagon, PackageCheck, Upload, X } from 'lucide-react';
import { getTypeColor, getToolThumbnail } from './nodes/ToolNode';
import type { TIPBundle } from '@/tip/protocol';

interface InspectorPanelProps {
    selectedNode: Node | null;
    updateNodeData: (nodeId: string, partialData: any) => void;
}

const labelStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: 6,
};

const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
};

const pillValue: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 12,
    color: '#e5e7eb',
};

function InputField({
    value,
    onChange,
    type = 'text',
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
}) {
    return (
        <input
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 8,
                color: '#e5e7eb',
                fontSize: 12,
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.5)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; }}
        />
    );
}

function SliderField({
    value,
    min,
    max,
    step,
    onChange,
}: {
    value: number; min: number; max: number; step: number;
    onChange: (v: number) => void;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
                type="range"
                min={min} max={max} step={step} value={value}
                onChange={e => onChange(Number(e.target.value))}
                style={{
                    width: '100%', height: 3, cursor: 'pointer',
                    accentColor: '#8b5cf6',
                }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#555', fontFamily: 'monospace' }}>
                <span>{min}</span>
                <span style={{
                    color: '#a78bfa', fontWeight: 700, fontSize: 12,
                    background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
                    padding: '1px 8px', borderRadius: 6,
                }}>
                    {value}
                </span>
                <span>{max}</span>
            </div>
        </div>
    );
}

function ToggleField({
    value,
    onChange,
}: {
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: value ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${value ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 9,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
            }}
            onClick={() => onChange(!value)}
        >
            {/* Custom toggle */}
            <div style={{
                width: 28, height: 16, borderRadius: 8,
                background: value ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${value ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.12)'}`,
                position: 'relative',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                boxShadow: value ? '0 0 8px rgba(139,92,246,0.4)' : 'none',
            }}>
                <div style={{
                    position: 'absolute',
                    top: 2, left: value ? 12 : 2,
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
            </div>
            <span style={{ fontSize: 12, color: value ? '#c4b5fd' : '#666', transition: 'color 0.15s ease' }}>
                {value ? 'Enabled' : 'Disabled'}
            </span>
        </div>
    );
}

function SelectField({
    value,
    options,
    onChange,
}: {
    value: string;
    options: { label: string; value: string | number }[];
    onChange: (v: string) => void;
}) {
    return (
        <div style={{ position: 'relative' }}>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '8px 32px 8px 10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 8, color: '#e5e7eb',
                    fontSize: 12, outline: 'none', appearance: 'none', cursor: 'pointer',
                    boxSizing: 'border-box',
                }}
            >
                {options.map(opt => (
                    <option key={String(opt.value)} value={String(opt.value)} style={{ background: '#111' }}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <div style={{
                position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', color: '#555',
            }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>
        </div>
    );
}

/**
 * InspectorPanel — Right-side panel that shows configuration for the selected node.
 * Dark-themed, premium look with custom-styled form controls.
 */
export function InspectorPanel({ selectedNode, updateNodeData }: InspectorPanelProps) {
    const panelStyle: React.CSSProperties = {
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        zIndex: 20,
        width: 280,
        background: 'rgba(12,12,14,0.97)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        boxShadow: '-4px 0 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    };

    if (!selectedNode) {
        return (
            <div style={panelStyle}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 12 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <SlidersHorizontal style={{ width: 22, height: 22, color: '#333' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                            Node Inspector
                        </div>
                        <div style={{ fontSize: 11.5, color: '#3a3a3a', lineHeight: 1.6 }}>
                            Select a node on the canvas to configure its settings
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // FileInput node
    if (selectedNode.type === 'fileInput') {
        const file = selectedNode.data.file as File | null;
        return (
            <div style={panelStyle}>
                <PanelHeader
                    icon={<Upload style={{ width: 15, height: 15, color: '#4ade80' }} />}
                    iconBg="rgba(74,222,128,0.12)"
                    iconBorder="rgba(74,222,128,0.2)"
                    title="File Input"
                    subtitle="Pipeline Starting Point"
                />
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={sectionStyle}>
                        <div style={labelStyle}>Selected File</div>
                        {file ? (
                            <div style={pillValue}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                                        {file.name}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#555', display: 'flex', gap: 8 }}>
                                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                                        <span style={{
                                            color: getTypeColor(file.type || ''),
                                            fontFamily: 'monospace', fontWeight: 600, fontSize: 9, textTransform: 'uppercase',
                                            background: `${getTypeColor(file.type || '')}18`,
                                            padding: '1px 5px', borderRadius: 3,
                                        }}>
                                            {file.type?.split('/')[1] || 'bin'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: 8,
                                padding: '10px 12px', background: 'rgba(245,158,11,0.07)',
                                border: '1px solid rgba(245,158,11,0.15)', borderRadius: 9,
                                fontSize: 11.5, color: '#d97706',
                            }}>
                                <AlertOctagon style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                                No file selected — click the node to upload.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Output node
    if (selectedNode.type === 'output') {
        const bundle = selectedNode.data.bundle as TIPBundle | undefined;
        const totalDurationMs = Number(selectedNode.data.totalDurationMs) || 0;
        return (
            <div style={panelStyle}>
                <PanelHeader
                    icon={<PackageCheck style={{ width: 15, height: 15, color: '#34d399' }} />}
                    iconBg="rgba(52,211,153,0.12)"
                    iconBorder="rgba(52,211,153,0.2)"
                    title="Pipeline Output"
                    subtitle="Terminal End Node"
                />
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={sectionStyle}>
                        <div style={labelStyle}>Execution Results</div>
                        {bundle ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {[
                                    ['Output Files', String(bundle.meta.count)],
                                    ['Total Size', `${(bundle.meta.totalSizeBytes / 1024).toFixed(1)} KB`],
                                    ...(totalDurationMs > 0 ? [['Duration', `${(totalDurationMs / 1000).toFixed(2)}s`]] : []),
                                ].map(([k, v]) => (
                                    <div key={k} style={pillValue}>
                                        <span style={{ color: '#666', fontSize: 11 }}>{k}</span>
                                        <span style={{ fontFamily: 'monospace', color: k === 'Duration' ? '#34d399' : '#d1fae5', fontWeight: 600 }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                padding: '20px', textAlign: 'center',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 10,
                                color: '#444', fontSize: 11.5,
                            }}>
                                Run the pipeline to see output stats
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Tool node
    const toolId = selectedNode.data.toolId as string;
    const tool = TIPToolRegistry.get(toolId);
    if (!tool) return null;

    const config = (selectedNode.data.config as Record<string, any>) || {};
    const thumbnail = getToolThumbnail(toolId);

    const handleConfigChange = (key: string, value: any) => {
        updateNodeData(selectedNode.id, { config: { ...config, [key]: value } });
    };

    const inColor = getTypeColor(tool.consumes[0] || '');
    const outColor = getTypeColor(tool.produces[0] || '');

    return (
        <div style={panelStyle}>
            {/* Tool header with thumbnail */}
            <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                {thumbnail ? (
                    <div style={{
                        width: 42, height: 42, borderRadius: 11, overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                        flexShrink: 0, position: 'relative',
                        background: '#1a1a1e',
                    }}>
                        <Image src={thumbnail} alt={tool.name} fill style={{ objectFit: 'cover' }} sizes="42px" />
                    </div>
                ) : (
                    <div style={{
                        width: 42, height: 42, borderRadius: 11,
                        background: 'rgba(139,92,246,0.1)',
                        border: '1px solid rgba(139,92,246,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 22 }}>⚙️</span>
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0', marginBottom: 2 }}>
                        {tool.name}
                    </div>
                    <div style={{ fontSize: 9.5, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {tool.id}
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Description */}
                <div style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '10px 12px',
                    background: 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.12)',
                    borderRadius: 10,
                    fontSize: 11.5, color: '#93c5fd', lineHeight: 1.6,
                }}>
                    <Info style={{ width: 13, height: 13, color: '#60a5fa', flexShrink: 0, marginTop: 1 }} />
                    {tool.description}
                </div>

                {/* I/O types */}
                <div style={sectionStyle}>
                    <div style={labelStyle}>Data Flow</div>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 9, padding: '10px',
                        display: 'flex', flexDirection: 'column', gap: 7,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                            <span style={{ color: '#555' }}>Accepts</span>
                            <span style={{
                                color: inColor, fontFamily: 'monospace', fontWeight: 700,
                                background: `${inColor}14`, border: `1px solid ${inColor}25`,
                                padding: '2px 8px', borderRadius: 5, fontSize: 10,
                                textTransform: 'uppercase',
                            }}>
                                {tool.consumes[0]?.split('/')[1] || 'any'}
                            </span>
                        </div>
                        <div style={{
                            height: 1, background: 'rgba(255,255,255,0.04)',
                            position: 'relative',
                        }}>
                            <div style={{
                                position: 'absolute', left: '50%', top: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: 14, color: '#333',
                            }}>→</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                            <span style={{ color: '#555' }}>Produces</span>
                            <span style={{
                                color: outColor, fontFamily: 'monospace', fontWeight: 700,
                                background: `${outColor}14`, border: `1px solid ${outColor}25`,
                                padding: '2px 8px', borderRadius: 5, fontSize: 10,
                                textTransform: 'uppercase',
                            }}>
                                {tool.produces[0]?.split('/')[1] || 'any'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Configuration fields */}
                <div style={sectionStyle}>
                    <div style={labelStyle}>Configuration</div>
                    {tool.configSchema.fields.length === 0 ? (
                        <div style={{
                            padding: '16px', textAlign: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 9,
                            color: '#444', fontSize: 11.5, fontStyle: 'italic',
                        }}>
                            No parameters to configure
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {tool.configSchema.fields.map(field => (
                                <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>
                                            {field.label}
                                        </label>
                                        {field.unit && (
                                            <span style={{
                                                fontSize: 9.5, fontFamily: 'monospace', color: '#666',
                                                background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4,
                                            }}>
                                                {field.unit}
                                            </span>
                                        )}
                                    </div>
                                    {field.description && (
                                        <div style={{ fontSize: 10.5, color: '#555', lineHeight: 1.5 }}>
                                            {field.description}
                                        </div>
                                    )}

                                    {field.type === 'number' && (
                                        <SliderField
                                            value={Number(config[field.key] ?? field.default)}
                                            min={field.min ?? 0}
                                            max={field.max ?? 100}
                                            step={field.step ?? 1}
                                            onChange={v => handleConfigChange(field.key, v)}
                                        />
                                    )}
                                    {field.type === 'boolean' && (
                                        <ToggleField
                                            value={Boolean(config[field.key] ?? field.default)}
                                            onChange={v => handleConfigChange(field.key, v)}
                                        />
                                    )}
                                    {(field.type === 'string' || field.type === 'password') && (
                                        <InputField
                                            type={field.type === 'password' ? 'password' : 'text'}
                                            value={String(config[field.key] ?? field.default ?? '')}
                                            placeholder={field.description}
                                            onChange={v => handleConfigChange(field.key, v)}
                                        />
                                    )}
                                    {field.type === 'select' && field.options && (
                                        <SelectField
                                            value={String(config[field.key] ?? field.default)}
                                            options={field.options as { label: string; value: string | number }[]}
                                            onChange={v => handleConfigChange(field.key, v)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PanelHeader({
    icon, iconBg, iconBorder, title, subtitle,
}: {
    icon: React.ReactNode;
    iconBg: string;
    iconBorder: string;
    title: string;
    subtitle: string;
}) {
    return (
        <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 10,
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: iconBg, border: `1px solid ${iconBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>{title}</div>
                <div style={{ fontSize: 9.5, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{subtitle}</div>
            </div>
        </div>
    );
}
