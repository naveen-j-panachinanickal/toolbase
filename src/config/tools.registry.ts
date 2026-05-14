// src/config/tools.registry.ts
// ============================================================
// SINGLE SOURCE OF TRUTH for all Toolbase tools.
// This file aggregates individual configurations from src/config/tools/*
// ============================================================

import { ToolCategory, ToolMeta } from "@/types/tool-search";
import { magicPdfConfig } from "./tools/magic-pdf";
import { pixelsConfig } from "./tools/pixels";
import { dataLensConfig } from "./tools/data-lens";
import { redactSecretsConfig } from "./tools/redact-secrets";
import { base64Config } from "./tools/base64";
import { jsonToInterfaceConfig } from "./tools/json-to-interface";
import { openDrawConfig } from "./tools/open-draw";
import { pingTesterConfig } from "./tools/ping-tester";
import { speedTestConfig } from "./tools/speed-test";
import { pipelineConfig } from "./tools/pipeline";
import { passwordxConfig } from "./tools/passwordx";
import { formatStudioConfig } from "./tools/format-studio";
import { dataBuilderConfig } from "./tools/data-builder";
import { archiveKitConfig } from "./tools/archive-kit";
import { noteVaultConfig } from "./tools/note-vault";
import { qrForgeConfig } from "./tools/qr-forge";

// ============================================================
// REGISTERED TOOLS
// ============================================================

export const TOOLS: ToolMeta[] = [
  noteVaultConfig,
  magicPdfConfig,
  pixelsConfig,
  dataLensConfig,
  redactSecretsConfig,
  base64Config,
  jsonToInterfaceConfig,
  openDrawConfig,
  pingTesterConfig,
  speedTestConfig,
  pipelineConfig,
  passwordxConfig,
  formatStudioConfig,
  dataBuilderConfig,
  archiveKitConfig,
  qrForgeConfig,
];

// ============================================================
// HELPERS — use these throughout the app, never filter TOOLS directly
// ============================================================

/** Get all tools */
export const getAllTools = (): ToolMeta[] => TOOLS;

/** Get a single tool by ID */
export const getToolById = (id: string): ToolMeta | undefined =>
  TOOLS.find((tool) => tool.id === id);

/** Get tools by category */
export const getToolsByCategory = (category: ToolCategory): ToolMeta[] =>
  TOOLS.filter((tool) => tool.category === category);

/** Get featured tools */
export const getFeaturedTools = (): ToolMeta[] =>
  TOOLS.filter((tool) => tool.isFeatured);

/** Get WASM-powered tools */
export const getWasmTools = (): ToolMeta[] =>
  TOOLS.filter((tool) => tool.wasmPowered);

/** Get all unique categories that have at least one tool */
export const getActiveCategories = (): ToolCategory[] =>
  [...new Set(TOOLS.map((tool) => tool.category))];

/**
 * Search tools by query — searches name, description, long description, and tags.
 * Supports tokenized matching and basic typo tolerance.
 * This is the canonical search function used by the app's CommandPalette.
 */
export const searchToolsFromRegistry = (query: string): ToolMeta[] => {
  const trimmedQuery = query.toLowerCase().trim();
  if (!trimmedQuery) return TOOLS;

  const queryTokens = trimmedQuery.split(/\s+/).filter(t => t.length > 0);

  const scoredTools = TOOLS.map((tool) => {
    let score = 0;

    const searchableText = [
      tool.name.toLowerCase(),
      tool.description.toLowerCase(),
      tool.longDescription?.toLowerCase() || '',
      ...tool.tags.map(t => t.toLowerCase())
    ].join(' ');

    if (searchableText.includes(trimmedQuery)) {
      score += 50;
    }

    for (const token of queryTokens) {
      if (tool.name.toLowerCase().includes(token)) {
        score += 10;
      } else if (tool.tags.some(t => t.toLowerCase().includes(token))) {
        score += 8;
      } else if (tool.description.toLowerCase().includes(token)) {
        score += 5;
      } else if (tool.longDescription?.toLowerCase().includes(token)) {
        score += 2;
      } else if (token.length >= 3) {
        const prefix = token.slice(0, 3);
        if (tool.name.toLowerCase().split(/\s+/).some(w => w.startsWith(prefix))) {
          score += 1;
        } else if (tool.tags.some(t => t.toLowerCase().startsWith(prefix))) {
          score += 1;
        } else if (tool.description.toLowerCase().includes(prefix)) {
          score += 0.5;
        }
      }
    }

    return { tool, score };
  });

  return scoredTools
    .filter(st => st.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(st => st.tool);
};
