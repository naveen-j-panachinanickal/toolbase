'use client';

/**
 * usePipelines — Save, load, export, and import user pipelines.
 *
 * All data lives in localStorage under 'toolbase:pipelines'.
 * Presets are never stored — they come from pipeline-presets.ts.
 *
 * API:
 *   const { pipelines, save, remove, exportJson, importJson } = usePipelines();
 */

import { useCallback, useEffect, useState } from 'react';
import type { PipelineDefinition } from '@/types/pipeline';
import { TIPToolRegistry } from '@/tip/registry';
import { validateTipVersion } from '@/tip/validators';

// TIP tools are now declaratively registered in TOOLS registry.


const STORAGE_KEY = 'toolbase:pipelines';

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ImportResult {
  success: boolean;
  pipeline?: PipelineDefinition;
  errors: string[];
  warnings: string[];
}

function validatePipelineShape(raw: unknown): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { success: false, errors: ['Invalid JSON: expected an object'], warnings };
  }

  const p = raw as Partial<PipelineDefinition>;

  if (!p.id || typeof p.id !== 'string') errors.push('Missing or invalid "id" field');
  if (!p.name || typeof p.name !== 'string') errors.push('Missing or invalid "name" field');
  if (!Array.isArray(p.steps)) errors.push('"steps" must be an array');
  if (!p.createdAt || typeof p.createdAt !== 'string') errors.push('Missing "createdAt" field');

  if (errors.length > 0) return { success: false, errors, warnings };

  // Validate all toolIds against live registry
  const missingTools: string[] = [];
  for (const step of p.steps ?? []) {
    if (!step.toolId) {
      errors.push(`A step is missing "toolId"`);
    } else if (!TIPToolRegistry.get(step.toolId)) {
      missingTools.push(step.toolId);
    }
  }
  if (missingTools.length > 0) {
    errors.push(`Unknown tool IDs: ${missingTools.join(', ')}. Are all tools registered?`);
  }

  // Version check — warn, never block
  const versionResult = validateTipVersion(p.tipVersion);
  versionResult.warnings.forEach((w) => warnings.push(w));

  if (errors.length > 0) return { success: false, errors, warnings };
  return { success: true, pipeline: p as PipelineDefinition, errors: [], warnings };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePipelines() {
  const [pipelines, setPipelines] = useState<PipelineDefinition[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PipelineDefinition[];
        setPipelines(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      console.warn('[usePipelines] Failed to parse saved pipelines — starting fresh');
      setPipelines([]);
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage whenever pipelines change (skip initial load)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pipelines));
    } catch (e) {
      console.error('[usePipelines] Failed to save pipelines to local storage', e);
    }
  }, [pipelines, isLoaded]);

  // ── save ──────────────────────────────────────────────────────────────────────

  const save = useCallback((pipeline: PipelineDefinition) => {
    setPipelines((prev) => {
      const existing = prev.findIndex((p) => p.id === pipeline.id);
      if (existing >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existing] = pipeline;
        return updated;
      }
      return [...prev, pipeline];
    });
  }, []);

  // ── remove ────────────────────────────────────────────────────────────────────

  const remove = useCallback((id: string) => {
    setPipelines((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── exportJson ────────────────────────────────────────────────────────────────

  const exportJson = useCallback((pipeline: PipelineDefinition) => {
    const json = JSON.stringify(pipeline, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = pipeline.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    a.href = url;
    a.download = `toolbase-pipeline-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, []);

  // ── importJson ────────────────────────────────────────────────────────────────

  const importJson = useCallback(
    async (file: File): Promise<ImportResult> => {
      try {
        const text = await file.text();
        const raw = JSON.parse(text);
        const result = validatePipelineShape(raw);
        if (result.success && result.pipeline) {
          // Give imported pipeline a fresh ID to avoid collisions
          const imported: PipelineDefinition = {
            ...result.pipeline,
            id: crypto.randomUUID(),
            isPreset: false,
          };
          save(imported);
          return { ...result, pipeline: imported };
        }
        return result;
      } catch (err) {
        return {
          success: false,
          errors: [`Failed to parse JSON: ${String(err)}`],
          warnings: [],
        };
      }
    },
    [save]
  );

  return { pipelines, isLoaded, save, remove, exportJson, importJson };
}
