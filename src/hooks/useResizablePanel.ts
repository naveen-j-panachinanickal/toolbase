import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizablePanelOptions {
    /** Initial height ratio of the top panel (0-1). Default: 0.5 */
    initialRatio?: number;
    /** Minimum height ratio for the top panel. Default: 0.2 */
    minRatio?: number;
    /** Maximum height ratio for the top panel. Default: 0.8 */
    maxRatio?: number;
}

interface UseResizablePanelReturn {
    /** Current ratio of the top panel (0-1) */
    ratio: number;
    /** Whether the user is currently dragging */
    isDragging: boolean;
    /** Props to spread on the drag handle element */
    handleProps: {
        onMouseDown: (e: React.MouseEvent) => void;
        style: React.CSSProperties;
        className: string;
    };
    /** Ref to attach to the container element */
    containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for creating a vertically resizable split pane.
 * Attach `containerRef` to the parent container and spread `handleProps` on the drag handle.
 */
export function useResizablePanel({
    initialRatio = 0.45,
    minRatio = 0.2,
    maxRatio = 0.8,
}: UseResizablePanelOptions = {}): UseResizablePanelReturn {
    const [ratio, setRatio] = useState(initialRatio);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const newRatio = (e.clientY - rect.top) / rect.height;
            setRatio(Math.min(maxRatio, Math.max(minRatio, newRatio)));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'row-resize';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
    }, [isDragging, minRatio, maxRatio]);

    const handleProps = {
        onMouseDown: handleMouseDown,
        style: { cursor: 'row-resize' } as React.CSSProperties,
        className: `group flex items-center justify-center h-2 hover:h-3 transition-all bg-transparent hover:bg-indigo-50 ${isDragging ? 'bg-indigo-100 h-3' : ''}`,
    };

    return { ratio, isDragging, handleProps, containerRef };
}
