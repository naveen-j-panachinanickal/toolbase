// src/config/tools.registry.ts
// ============================================================
// SINGLE SOURCE OF TRUTH for all Toolbase tools.
// This file aggregates individual configurations from src/config/tools/*
// ============================================================

import { ToolCategory, ToolMeta } from "@/shared/types/tool-search";
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

// ============================================================
// REGISTERED TOOLS
// ============================================================

/**
 * The master list of all tools registered in the Toolbase platform.
 * 
 * Each tool entry defines metadata used for discovery, UI rendering, 
 * and technical capability signaling (e.g., WASM/Python power).
 */
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
];

// ============================================================
// HELPERS — use these throughout the app, never filter TOOLS directly
// ============================================================

/**
 * Returns the complete list of registered tools.
 * @returns {ToolMeta[]} The full tool catalog.
 */
export const getAllTools = (): ToolMeta[] => TOOLS;

/**
 * Retrieves a tool by its unique identifier.
 * @param id - The unique ID of the tool (e.g., 'pixels/resize').
 * @returns {ToolMeta | undefined} The tool metadata if found.
 */
export const getToolById = (id: string): ToolMeta | undefined =>
  TOOLS.find((tool) => tool.id === id);

/**
 * Filters the registry to find tools belonging to a specific category.
 * @param category - The category to filter by (e.g., 'Data', 'Images').
 * @returns {ToolMeta[]} Matching tools.
 */
export const getToolsByCategory = (category: ToolCategory): ToolMeta[] =>
  TOOLS.filter((tool) => tool.category === category);

/**
 * Returns tools marked as 'featured' for landing page visibility.
 * @returns {ToolMeta[]} Featured tools.
 */
export const getFeaturedTools = (): ToolMeta[] =>
  TOOLS.filter((tool) => tool.isFeatured);

/**
 * Returns tools that utilize WebAssembly for heavy lifting.
 * @returns {ToolMeta[]} WASM-powered tools.
 */
export const getWasmTools = (): ToolMeta[] =>
  TOOLS.filter((tool) => tool.wasmPowered);

/**
 * Retrieves all unique categories that contain at least one registered tool.
 * @returns {ToolCategory[]} Active tool categories.
 */
export const getActiveCategories = (): ToolCategory[] =>
  [...new Set(TOOLS.map((tool) => tool.category))];

/**
 * Performs a weighted heuristic search across the tool registry.
 * 
 * Searches the following fields in order of descending importance:
 * 1. Name (exact match or prefix)
 * 2. Tags (exact match or prefix)
 * 3. Description (short and long)
 * 
 * Supports tokenized matching (multi-word queries) and basic typo tolerance 
 * via 3-character prefix matching.
 *
 * @param query - The raw search string from the user.
 * @returns {ToolMeta[]} A ranked list of matching tools.
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

    // Exact string match bonus
    if (searchableText.includes(trimmedQuery)) {
      score += 50;
    }

    // Tokenized scoring
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
        // Prefix matching for basic typo tolerance
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
