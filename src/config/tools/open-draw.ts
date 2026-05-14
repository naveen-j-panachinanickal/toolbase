import { ToolMeta } from "@/types/tool-search";

export const openDrawConfig: ToolMeta = {
  id: 'open-draw',
  name: 'Open Draw',
  description: 'Create diagrams, flowcharts and system designs with a full diagramming canvas.',
  longDescription:
    'Open Draw is a privacy-first diagramming tool inspired by draw.io. Create system architecture diagrams, flowcharts, entity relationship diagrams, network diagrams and more. Export to SVG, PNG or XML. Everything stays in your browser — no cloud sync required.',
  category: 'drawing',
  route: 'open-draw',
  thumbnail: '/assets/thumbnails/open-draw.png',
  tags: ['diagram', 'flowchart', 'draw', 'architecture', 'erd', 'svg', 'canvas', 'shapes'],
  isNew: false,
  isFeatured: true,
  wasmPowered: false,
  pythonPowered: true,
  status: 'stable',
  addedAt: '2025-01-01',
  mobileOptimized: false,
};
