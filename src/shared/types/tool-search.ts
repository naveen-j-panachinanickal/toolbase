import { StaticImageData } from "next/image";

/**
 * Represents the high-level functional categories for tools in the platform.
 */
export type ToolCategory =
  | 'pdf'
  | 'image'
  | 'text'
  | 'data'
  | 'network'
  | 'security'
  | 'drawing'
  | 'developer'
  | 'ai';

/**
 * Indicates the stability and readiness of a tool.
 */
export type ToolStatus = 'stable' | 'beta' | 'experimental';

/**
 * The master metadata schema for any tool registered in the platform.
 * 
 * This object is used by the Home Grid for rendering, the Search Engine 
 * for discovery, and the Pipeline Builder for connecting tool chains.
 */
export interface ToolMeta {
  /** Unique identifier — matches the folder name in src/app/tools/ */
  id: string;
  /** Display name shown in the UI */
  name: string;
  /** Short one-liner shown on tool cards */
  description: string;
  /** Longer description for tool detail page and SEO */
  longDescription?: string;
  /** Primary category for filtering */
  category: ToolCategory;
  /** Next.js route to the tool (must be same as tool folder name)*/
  route: string;
  /** Path to thumbnail image in /public/assets/thumbnails/ */
  thumbnail: string;
  /** Search tags — used by the search engine */
  tags: string[];
  /** Shows "NEW" badge on tool card */
  isNew?: boolean;
  /** Featured on home/landing page */
  isFeatured?: boolean;
  /** Indicates the tool runs high-performance WASM logic locally. */
  wasmPowered?: boolean;
  /** Indicates the tool runs Python logic via Pyodide in the browser. */
  pythonPowered?: boolean;
  /** Stability status */
  status: ToolStatus;
  /** ISO date string — when this tool was added */
  addedAt: string;
  /** Whether this tool is optimized for mobile devices */
  mobileOptimized: boolean;
  /** GitHub username of the contributor who built this tool */
  author?: string;
  /** 
   * TIP Protocol Integration Configuration.
   * 
   * If defined, this tool can participate in the Pipeline Builder.
   * A single UI tool can expose multiple distinct TIP-compliant operations.
   */
  tip?: {
    /** Unique ID for the operation (e.g. "magic-pdf/compress") */
    id: string;
    /** Human-readable name for the operation node */
    name: string;
    /** Description for the operation node */
    description: string;
    /** MIME types this operation can accept as input */
    consumes: import('@/platform/tip').TIPContentType[];
    /** MIME types this operation produces as output */
    produces: import('@/platform/tip').TIPContentType[];
    /** Declarative schema for tool settings */
    configSchema: import('@/platform/tip').TIPConfigSchema;
    /**
     * Lazily loads the execution logic (the tool's `invoke` method).
     */
    getExecutor: () => Promise<(input: import('@/platform/tip').TIPBundle, config: import('@/platform/tip').TIPConfig, hooks: import('@/platform/tip').TIPHooks) => Promise<import('@/platform/tip').TIPBundle>>;
    /** Whether this specific operation is optimized for mobile */
    mobileOptimized: boolean;
    /**
     * If true, this operation requires user interaction/configuration 
     * before it can be executed in a pipeline.
     */
    interactable?: true;
    /**
     * Lazily loads the React component used for user interaction.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getInteractionComponent?: () => Promise<(props: import('@/platform/tip').TIPInteractionProps) => any>;
  }[];
}

/**
 * Props for the ToolCard React component.
 */
export interface ToolCardProps {
    /** The tool's display name */
    title: string;
    /** The navigation route */
    route: string;
    /** The tool's icon or thumbnail */
    icon: StaticImageData | string;
    /** Secondary metadata labels shown on the card */
    metadata: string[];
    /** Registry ID for tracking preferences */
    toolId?: string;
    /** legacy field for bottom navigation compatibility */
    toolFolderName?: string;
}
