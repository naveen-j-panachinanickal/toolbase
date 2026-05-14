import { ToolMeta } from "@/types/tool-search";

export const jsonToInterfaceConfig: ToolMeta = {
  id: 'json-to-interface',
  name: 'JSON to Interface',
  description: 'Convert any JSON object into TypeScript interfaces instantly.',
  longDescription:
    'Paste any JSON and instantly get a typed TypeScript interface. Handles nested objects, arrays, optional fields, and complex structures. Saves developers hours of manual type writing. Runs entirely in the browser — paste sensitive API responses without worry.',
  category: 'developer',
  route: 'json-to-interface',
  thumbnail: '/assets/thumbnails/json-to-interface.png',
  tags: ['json', 'typescript', 'interface', 'types', 'convert', 'developer'],
  isNew: false,
  isFeatured: false,
  wasmPowered: false,
  pythonPowered: false,
  status: 'stable',
  addedAt: '2025-01-01',
  mobileOptimized: true,
};
