import { useCallback, useEffect, useRef, useState } from 'react';
import { Node, Edge } from '@xyflow/react';

/**
 * useUndoRedo — Manage a history stack of node/edge states.
 * 
 * Snapshots are taken manually via takeSnapshot() after significant actions
 * like finishing a drag, connecting, or deleting nodes.
 */
export function useUndoRedo(
  nodes: Node[],
  edges: Edge[],
  setNodes: (update: Node[] | ((nds: Node[]) => Node[])) => void,
  setEdges: (update: Edge[] | ((eds: Edge[]) => Edge[])) => void
) {
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [index, setIndex] = useState(-1);
  const isInternalUpdate = useRef(false);

  // Take a snapshot of current state (should be called AFTER a state change is finalized)
  const takeSnapshot = useCallback(() => {
    if (isInternalUpdate.current) return;

    const cleanNodes = nodes.map(n => ({
        ...n,
        // Strip transient/non-serializable data to keep history lean
        data: { ...n.data, file: null, bundle: null, previewFiles: undefined }
    }));

    setHistory((prev) => {
      // If we're not at the end of the stack, discard the 'future'
      const next = prev.slice(0, index + 1);
      
      // Simple content comparison to avoid redundant snapshots
      const last = next[next.length - 1];
      if (last && JSON.stringify(last.nodes) === JSON.stringify(cleanNodes) && JSON.stringify(last.edges) === JSON.stringify(edges)) {
        return next;
      }

      return [...next, { nodes: cleanNodes, edges: JSON.parse(JSON.stringify(edges)) }];
    });
    setIndex((prev) => prev + 1);
  }, [nodes, edges, index]);

  const undo = useCallback(() => {
    if (index <= 0) return;
    
    const prev = history[index - 1];
    isInternalUpdate.current = true;
    
    // We must use functional updates or ensure we don't trigger another snapshot immediately
    setNodes(() => prev.nodes);
    setEdges(() => prev.edges);
    setIndex(index - 1);
    
    // Release guard after state has propagated
    setTimeout(() => { isInternalUpdate.current = false; }, 50);
  }, [history, index, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (index >= history.length - 1) return;
    
    const next = history[index + 1];
    isInternalUpdate.current = true;
    
    setNodes(() => next.nodes);
    setEdges(() => next.edges);
    setIndex(index + 1);
    
    setTimeout(() => { isInternalUpdate.current = false; }, 50);
  }, [history, index, setNodes, setEdges]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        // Don't intercept if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
        }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  // Initial snapshot on first load (once nodes are present)
  useEffect(() => {
    if (history.length === 0 && nodes.length > 0) {
        takeSnapshot();
    }
  }, [history.length, nodes.length, takeSnapshot]);

  const clearHistory = useCallback(() => {
      setHistory([]);
      setIndex(-1);
  }, []);

  return { 
    undo, 
    redo, 
    takeSnapshot, 
    clearHistory,
    canUndo: index > 0, 
    canRedo: index < history.length - 1 
  };
}
