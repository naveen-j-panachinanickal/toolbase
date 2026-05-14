'use client';

/**
 * EmptyState
 *
 * A consistent, beautiful empty-state drop zone used across every tool page.
 * Handles drag-over highlight itself so callers don't need extra wiring.
 */

import React, { useState, useCallback } from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    /** Icon element to display (e.g. a Lucide icon) */
    icon: React.ReactNode;
    /** Primary headline */
    title: string;
    /** Secondary helper text */
    description: string;
    /** Called when files are dropped — receives FileList */
    onDrop?: (files: FileList) => void;
    /** Called when files are picked via the hidden input */
    onFileSelect?: (files: FileList) => void;
    /** Accept string passed to <input type="file"> */
    accept?: string;
    /** Allow selecting multiple files */
    multiple?: boolean;
    /** Extra wrapper className */
    className?: string;
    /** Optional action slot below description (e.g. a <Button> for "browse files") */
    action?: React.ReactNode;
}

export function EmptyState({
    icon,
    title,
    description,
    onDrop,
    onFileSelect,
    accept,
    multiple = false,
    className,
    action,
}: EmptyStateProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputId = React.useId();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        // Only clear drag if leaving the zone entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length && onDrop) {
            onDrop(e.dataTransfer.files);
        }
    }, [onDrop]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length && onFileSelect) {
            onFileSelect(e.target.files);
        }
    }, [onFileSelect]);

    return (
        <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
                'relative flex flex-col items-center justify-center gap-5 rounded-3xl',
                'border-2 border-dashed transition-all duration-200 p-12 text-center min-h-[340px]',
                isDragging
                    ? 'border-primary/60 bg-primary/5 scale-[1.01]'
                    : 'hover:border-[var(--border-medium)]',
                className
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Animated Icon */}
            <m.div
                animate={isDragging ? { scale: 1.15, rotate: -4 } : { scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center',
                    'border shadow-[0_4px_16px_var(--shadow-color)]',
                    isDragging && 'text-primary border-primary/30 shadow-[0_4px_20px_rgba(43,140,238,0.15)]'
                )}
                style={{
                    background: 'var(--surface-elevated)',
                    borderColor: isDragging ? undefined : 'var(--border-subtle)',
                    color: isDragging ? undefined : 'var(--text-muted)',
                }}
            >
                {icon}
            </m.div>

            {/* Text */}
            <div className="space-y-2 max-w-xs">
                <p className={cn(
                    'text-[15px] font-semibold tracking-tight transition-colors',
                )}
                style={{ color: isDragging ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {isDragging ? 'Release to load' : title}
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {description}
                </p>
            </div>

            {/* Action / Browse button */}
            {(action || onFileSelect) && (
                <div>
                    {action ?? (
                        <label
                            htmlFor={inputId}
                            className="macos-button cursor-pointer text-sm"
                        >
                            Browse files
                        </label>
                    )}
                    {onFileSelect && (
                        <input
                            id={inputId}
                            type="file"
                            accept={accept}
                            multiple={multiple}
                            className="sr-only"
                            onChange={handleInputChange}
                        />
                    )}
                </div>
            )}

            {/* Drag overlay label */}
            {isDragging && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-3xl border-2 border-primary/40 pointer-events-none"
                />
            )}
        </m.div>
    );
}
