/**
 * TIPToolRegistry — Tool discovery and pipeline auto-routing
 *
 * The registry is the intelligence hub of TIP.
 * Tools are registered declaratively in src/config/tools.registry.ts.
 * The registry then powers:
 *  - Step selector UI (what tools can come next?)
 *  - Pipeline validation (does this chain typecheck?)
 *  - Auto-discovery (what's the shortest path from PDF to PNG?)
 */

import type { TIPContentType, TIPTool } from './protocol';
import { TOOLS } from '@/config/tools.registry';

/** Helper to construct a TIPTool interface from a single TIP operation config in ToolMeta */
function toTIPTool(config: NonNullable<typeof TOOLS[0]['tip']>[0]): TIPTool {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    consumes: config.consumes,
    produces: config.produces,
    configSchema: config.configSchema,
    mobileOptimized: config.mobileOptimized ?? false,
    // INP: forward optional interactive fields so ToolNode can detect them
    interactable: config.interactable,
    getInteractionComponent: config.getInteractionComponent,
    invoke: async (input, configValue, hooks) => {
      const execute = await config.getExecutor();
      return execute(input, configValue, hooks);
    },
  };
}

// Internal storage for temporary/custom tools (mostly for tests)
const customTools: TIPTool[] = [];

export const TIPToolRegistry = {
  // ── Retrieval ───────────────────────────────────────────────────────────────

  /** Register new tools dynamically (primarily used for tests). */
  registerAll(tools: TIPTool[]): void {
    customTools.push(...tools);
  },

  /** Clear all dynamically registered tools. */
  clear(): void {
    customTools.length = 0;
  },

  /** Get a tool by its TIP ID (e.g. 'magic-pdf/compress'). Returns undefined if not found. */
  get(id: string): TIPTool | undefined {
    // Check custom tools first
    const custom = customTools.find((t) => t.id === id);
    if (custom) return custom;

    for (const meta of TOOLS) {
      if (!meta.tip) continue;
      const config = meta.tip.find((c) => c.id === id);
      if (config) return toTIPTool(config);
    }
    return undefined;
  },

  /** Return all strictly TIP-compliant operations registered across all tools. */
  getAll(): TIPTool[] {
    const all: TIPTool[] = [...customTools];
    for (const meta of TOOLS) {
      if (meta.tip) {
        for (const config of meta.tip) {
          all.push(toTIPTool(config));
        }
      }
    }
    return all;
  },

  /** Return the number of TIP-compliant operations. */
  size(): number {
    return this.getAll().length;
  },

  // ── Discovery ───────────────────────────────────────────────────────────────


  /** Find all tools that declare the given content type in their `consumes` list. */
  findConsumers(contentType: TIPContentType): TIPTool[] {
    return this.getAll().filter((t) => t.consumes.includes(contentType));
  },

  /** Find all tools that declare the given content type in their `produces` list. */
  findProducers(contentType: TIPContentType): TIPTool[] {
    return this.getAll().filter((t) => t.produces.includes(contentType));
  },

  /**
   * THE STEP SELECTOR FUNCTION.
   *
   * Given the current output content type, which tools can come next?
   * Checks both:
   *  1. Direct compatibility: tool.consumes.includes(currentContentType)
   *  2. Via transformer: canTransform(currentContentType, accepted) for any accepted type
   *
   * Powers the step selector in the Pipeline Builder UI.
   *
   * @param currentContentType - The contentType the previous step produced
   * @param canTransform       - Function from transformers.ts (injected to avoid circular deps)
   */
  findNextSteps(
    currentContentType: TIPContentType,
    canTransform: (from: TIPContentType, to: TIPContentType) => boolean
  ): TIPTool[] {
    return this.getAll().filter((tool) =>
      tool.consumes.some(
        (accepted) =>
          accepted === currentContentType ||
          canTransform(currentContentType, accepted)
      )
    );
  },

  /**
   * AUTO-DISCOVER PIPELINE.
   *
   * Given a starting content type and a target content type, find all valid
   * paths through registered tools that transform `from` into `to`.
   *
   * Uses BFS — guarantees the shortest paths are returned first.
   * Results are sorted by path length (shortest first).
   *
   * This function powers:
   *  - "What's the shortest way to get from PDF to PNG?" queries
   *  - Future AI-suggested pipeline recommendations
   *  - Pipeline validation (does a path exist at all?)
   *
   * @param from     - Starting content type (e.g., 'application/pdf')
   * @param to       - Target content type (e.g., 'image/png')
   * @param maxDepth - Maximum chain length to explore (default 5, prevents infinite loops)
   *
   * @returns Array of TIPTool arrays — each inner array is one valid pipeline.
   *          Returns [] if no path exists.
   *
   * @example
   * const paths = TIPToolRegistry.discoverPath('application/pdf', 'image/png');
   * // paths[0] → the shortest valid tool chain
   * // paths[0].map(t => t.id) → ['magic-pdf/pdf-to-images']
   */
  discoverPath(
    from: TIPContentType,
    to: TIPContentType,
    maxDepth = 5
  ): TIPTool[][] {
    type QueueItem = { path: TIPTool[]; currentType: TIPContentType };

    const queue: QueueItem[] = [{ path: [], currentType: from }];
    const results: TIPTool[][] = [];

    while (queue.length > 0) {
      const { path, currentType } = queue.shift()!;

      // Guard against runaway paths
      if (path.length >= maxDepth) continue;

      const candidates = this.findConsumers(currentType);

      for (const tool of candidates) {
        // Avoid cycles — don't add a tool already in the current path
        if (path.some((t) => t.id === tool.id)) continue;

        const newPath = [...path, tool];

        for (const outputType of tool.produces) {
          if (outputType === to) {
            // We reached the target type — record this path
            results.push(newPath);
          } else {
            // Keep exploring from this output type
            queue.push({ path: newPath, currentType: outputType });
          }
        }
      }
    }

    // Sort by path length — shortest first (BFS already ensures this,
    // but an explicit sort makes the contract clear and handles equal lengths)
    return results.sort((a, b) => a.length - b.length);
  },
};
