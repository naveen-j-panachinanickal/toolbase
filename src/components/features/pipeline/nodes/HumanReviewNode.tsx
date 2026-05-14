'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ShieldCheck, Loader2, PlayCircle, Settings2, AlertCircle } from 'lucide-react';
import { getTypeColor } from './ToolNode';

/**
 * HumanReviewNode — A specialized "Gate" node for manual approvals.
 * 
 * Distinctive shape and color to signal it's a control node, not a processing tool.
 */
export function HumanReviewNode({ data }: { data: any }) {
    const status = data.status || 'idle';
    const isPending = status === 'paused' || data.isWaitingForReview;
    const isComplete = status === 'complete';
    const isError = status === 'error';

    // Gate branding
    const activeColor = isPending ? '#fbbf24' : isComplete ? '#22c55e' : isError ? '#ef4444' : '#8b5cf6';
    const glow = isPending ? '0 0 20px rgba(251,191,36,0.4)' : 'none';

    return (
        <div style={{
            width: 180,
            background: 'linear-gradient(145deg, #1a1a1e 0%, #111113 100%)',
            border: `2px solid ${isPending ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 16,
            padding: '12px',
            boxShadow: `${glow}, 0 10px 30px rgba(0,0,0,0.5)`,
            transition: 'all 0.3s ease',
            position: 'relative',
        }}>
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#666', width: 9, height: 9, border: '2px solid #111' }}
            />

            {/* Icon + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: isPending ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isPending ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <ShieldCheck style={{ width: 20, height: 20, color: activeColor }} />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Gate</div>
                    <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Human Review</div>
                </div>
            </div>

            {/* Status Text */}
            <div style={{
                fontSize: 10,
                color: isPending ? '#fbbf24' : isComplete ? '#4ade80' : isError ? '#f87171' : '#999',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
                marginBottom: 10,
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
            }}>
                {isPending ? (
                    <>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1.5s infinite' }} />
                        ACTION REQUIRED
                    </>
                ) : isComplete ? (
                    <>
                        <ShieldCheck style={{ width: 12, height: 12 }} />
                        APPROVED
                    </>
                ) : isError ? (
                    <>
                        <AlertCircle style={{ width: 12, height: 12 }} />
                        REJECTED
                    </>
                ) : (
                    <>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#444' }} />
                        IDLE
                    </>
                )}
            </div>

            {/* Main Action Button */}
            <button
                className="nopan nodrag"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => data.onOpenInteraction?.()}
                style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: isPending ? '#fbbf24' : 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: isPending ? '#000' : '#888',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                    boxShadow: isPending ? '0 4px 12px rgba(251,191,36,0.3)' : 'none',
                }}
            >
                {isPending ? (
                    <>
                        <PlayCircle style={{ width: 14, height: 14 }} />
                        REVIEW NOW
                    </>
                ) : (
                    <>
                        <Settings2 style={{ width: 14, height: 14 }} />
                        {isComplete ? 'RE-REVIEW' : 'CONFIGURE'}
                    </>
                )}
            </button>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#666', width: 9, height: 9, border: '2px solid #111' }}
            />

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
