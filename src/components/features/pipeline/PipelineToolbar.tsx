import React from 'react';
import { Play, Square, RotateCcw, Save, Download, Minus, Plus, Maximize2, Pause, Folder, Undo, Redo } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useAnyWorkerWarming } from '@/workers/instances';

interface PipelineToolbarProps {
    onRun: () => void;
    onStop: () => void;
    onPause: () => void;
    onResume: () => void;
    onReset: () => void;
    onSave: () => void;
    onLoad: () => void;
    onExport: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isRunning: boolean;
    isPaused: boolean;
    canRun: boolean;
}

/**
 * PipelineToolbar — Floating pill-style toolbar at top center of the canvas.
 */
export function PipelineToolbar({
    onRun,
    onStop,
    onPause,
    onResume,
    onReset,
    onSave,
    onLoad,
    onExport,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    isRunning,
    isPaused,
    canRun,
}: PipelineToolbarProps) {
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    const divider = (
        <div style={{
            width: 1, height: 20,
            background: 'rgba(255,255,255,0.08)',
            flexShrink: 0,
        }} />
    );

    const iconBtn = (
        onClick: () => void,
        icon: React.ReactNode,
        title: string,
        disabled = false
    ) => (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32,
                background: 'none',
                border: 'none',
                borderRadius: 7,
                cursor: disabled ? 'not-allowed' : 'pointer',
                color: disabled ? '#333' : '#888',
                transition: 'all 0.15s ease',
                opacity: disabled ? 0.4 : 1,
            }}
            onMouseEnter={e => {
                if (!disabled) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#d1d5db';
                }
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
                (e.currentTarget as HTMLButtonElement).style.color = disabled ? '#333' : '#888';
            }}
        >
            {icon}
        </button>
    );

    const isWarming = useAnyWorkerWarming();

    return (
        <div style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            background: 'rgba(14,14,16,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset',
        }}>
            {/* Run / Stop primary button */}
            {(isRunning || isPaused) ? (
                <button
                    onClick={onStop}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px',
                        background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 9,
                        color: '#fca5a5',
                        fontSize: 12, fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.03em',
                        boxShadow: '0 2px 8px rgba(239,68,68,0.2)',
                    }}
                >
                    <Square style={{ width: 11, height: 11, fill: 'currentColor' }} />
                    Stop
                </button>
            ) : (
                <button
                    onClick={onRun}
                    disabled={!canRun}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 16px',
                        background: canRun
                            ? 'linear-gradient(135deg, #059669, #10b981)'
                            : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${canRun ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 9,
                        color: canRun ? 'white' : '#444',
                        fontSize: 12, fontWeight: 700,
                        cursor: canRun ? 'pointer' : 'not-allowed',
                        letterSpacing: '0.03em',
                        boxShadow: canRun ? '0 2px 10px rgba(16,185,129,0.3)' : 'none',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Play style={{ width: 11, height: 11, fill: 'currentColor' }} />
                    Run Pipeline
                </button>
            )}

            {/* Pause / Resume button */}
            {(isRunning || isPaused) && (
                <button
                    onClick={isPaused ? onResume : onPause}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 9,
                        color: '#ccc',
                        fontSize: 12, fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.03em',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                    {isPaused ? (
                        <>
                            <Play style={{ width: 11, height: 11, fill: 'currentColor' }} />
                            Resume
                        </>
                    ) : (
                        <>
                            <Pause style={{ width: 11, height: 11, fill: 'currentColor' }} />
                            Pause
                        </>
                    )}
                </button>
            )}

            {divider}
            
            {iconBtn(onUndo, <Undo style={{ width: 14, height: 14 }} />, 'Undo (Ctrl+Z)', !canUndo)}
            {iconBtn(onRedo, <Redo style={{ width: 14, height: 14 }} />, 'Redo (Ctrl+Y)', !canRedo)}

            {divider}

            {iconBtn(onReset, <RotateCcw style={{ width: 14, height: 14 }} />, 'Reset execution')}
            {iconBtn(onLoad, <Folder style={{ width: 14, height: 14 }} />, 'Load pipeline')}
            {iconBtn(onSave, <Save style={{ width: 14, height: 14 }} />, isWarming ? 'Library loading... please wait' : 'Save pipeline', isWarming)}
            {iconBtn(onExport, <Download style={{ width: 14, height: 14 }} />, 'Export JSON')}

            {divider}

            {iconBtn(() => zoomOut(), <Minus style={{ width: 14, height: 14 }} />, 'Zoom out')}
            {iconBtn(() => zoomIn(), <Plus style={{ width: 14, height: 14 }} />, 'Zoom in')}
            {iconBtn(() => fitView({ duration: 600 }), <Maximize2 style={{ width: 13, height: 13 }} />, 'Fit to view')}
        </div>
    );
}
