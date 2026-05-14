import { ToolCardProps } from "@/shared/types/tool-search";
import { TOOLS } from "@/config/tools.registry";

/**
 * Filters and scores tools based on a search query.
 * 
 * Performs a deep search against titles, descriptions, and tags. 
 * Implements a weighted scoring system:
 * - Exact phrase match: Highest priority (+50)
 * - Title match: High priority (+10)
 * - Tag match: Medium priority (+8)
 * - Description match: Low priority (+5)
 * - Prefix/Typo tolerance: Minimal boost (+1)
 *
 * @param tools - Array of tool card props to search through.
 * @param query - The search string.
 * @returns Filtered array of tools, sorted by relevance score.
 */
export const searchTools = (tools: ToolCardProps[], query: string): ToolCardProps[] => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
        return tools;
    }

    const queryTokens = trimmedQuery.split(/\s+/).filter(t => t.length > 0);

    const scoredTools = tools.map(tool => {
        let score = 0;
        
        // Find the full tool from the registry to search deeper metadata
        const registryTool = tool.toolId ? TOOLS.find(t => t.id === tool.toolId) : null;
        
        // Stringify all searchable text for exact phrase matching
        const searchableText = [
            tool.title.toLowerCase(),
            registryTool?.description?.toLowerCase() || '',
            registryTool?.longDescription?.toLowerCase() || '',
            ...tool.metadata.map(m => m.toLowerCase())
        ].join(' ');

        // Huge boost for an exact phrase match anywhere in the content
        if (searchableText.includes(trimmedQuery)) {
            score += 50;
        }

        // Score based on individual tokens
        for (const token of queryTokens) {
            // Title exact match
            if (tool.title.toLowerCase().includes(token)) {
                score += 10;
            }
            // Tags/Metadata exact match
            else if (tool.metadata.some(m => m.toLowerCase().includes(token))) {
                score += 8;
            }
            // Short description match
            else if (registryTool?.description?.toLowerCase().includes(token)) {
                score += 5;
            }
            // Long description match
            else if (registryTool?.longDescription?.toLowerCase().includes(token)) {
                score += 2;
            }
            // Basic typo tolerance (if token length >= 3, check if any word starts with those 3 chars)
            else if (token.length >= 3) {
                const prefix = token.slice(0, 3);
                if (tool.title.toLowerCase().split(/\s+/).some(w => w.startsWith(prefix))) {
                    score += 1;
                } else if (tool.metadata.some(m => m.toLowerCase().startsWith(prefix))) {
                    score += 1;
                } else if (registryTool?.description?.toLowerCase().includes(prefix)) {
                    score += 0.5;
                }
            }
        }

        return { tool, score };
    });

    // Return tools that matched at least something, sorted by highest score first
    return scoredTools
        .filter(st => st.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(st => st.tool);
};
