'use client';

import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Save, User, FileText, Type } from 'lucide-react';

interface SavePipelineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (metadata: { name: string; description?: string; author?: string }) => void;
    initialData?: { name: string; description?: string; author?: string };
}

/**
 * SavePipelineModal — A modern, elegant modal for entering pipeline metadata.
 */
export function SavePipelineModal({
    isOpen,
    onClose,
    onSave,
    initialData,
}: SavePipelineModalProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [author, setAuthor] = useState(initialData?.author || '');

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setAuthor(initialData.author || '');
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            author: author.trim() || undefined,
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <m.div
                    key="save-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <m.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        style={{
                            width: '100%',
                            maxWidth: 480,
                            background: '#0a0a0b',
                            borderRadius: 24,
                            boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '24px 32px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#111113',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ 
                                    width: 40, height: 40, borderRadius: 12, 
                                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                                }}>
                                    <Save style={{ width: 20, height: 20, color: '#fff' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Save Pipeline</div>
                                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Enter a title and description</div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    width: 32, height: 32, borderRadius: 10, border: 'none',
                                    background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: '#888',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <X style={{ width: 16, height: 16 }} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Pipeline Name */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#aaa' }}>
                                    <Type style={{ width: 14, height: 14, color: '#8b5cf6' }} />
                                    Pipeline Title
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="My Awesome Pipeline"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={{
                                        padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: 14, outline: 'none', transition: 'all 0.2s',
                                        background: 'rgba(255,255,255,0.03)',
                                        color: '#fff',
                                    }}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = '#8b5cf6')}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>

                            {/* Author */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#aaa' }}>
                                    <User style={{ width: 14, height: 14, color: '#8b5cf6' }} />
                                    Author
                                </label>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    style={{
                                        padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: 14, outline: 'none', transition: 'all 0.2s',
                                        background: 'rgba(255,255,255,0.03)',
                                        color: '#fff',
                                    }}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = '#8b5cf6')}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>

                            {/* Description */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#aaa' }}>
                                    <FileText style={{ width: 14, height: 14, color: '#8b5cf6' }} />
                                    Description
                                </label>
                                <textarea
                                    placeholder="What does this pipeline do?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={{
                                        padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: 14, outline: 'none', transition: 'all 0.2s',
                                        background: 'rgba(255,255,255,0.03)', minHeight: 100, resize: 'none',
                                        fontFamily: 'inherit',
                                        color: '#fff',
                                    }}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = '#8b5cf6')}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '24px 32px',
                            background: '#111113',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 12,
                        }}>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'transparent', color: '#888', fontWeight: 600, fontSize: 13,
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!name.trim()}
                                style={{
                                    padding: '10px 24px', borderRadius: 12, border: 'none',
                                    background: name.trim() ? '#8b5cf6' : '#d1d5db',
                                    color: '#fff', fontWeight: 700, fontSize: 13,
                                    cursor: name.trim() ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s',
                                    boxShadow: name.trim() ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
                                }}
                            >
                                Save Pipeline
                            </button>
                        </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
