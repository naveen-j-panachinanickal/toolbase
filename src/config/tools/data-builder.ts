import { ToolMeta } from "@/types/tool-search";

export const dataBuilderConfig: ToolMeta = {
  id: 'data-builder',
  name: 'DataBuilder',
  description: 'Generate realistic mock datasets from field definitions or blueprint schemas.',
  longDescription:
    'DataBuilder helps you create structured mock data for testing and prototyping. Build datasets from field-level controls or advanced nested blueprints, then export in JSON or XML locally in your browser.',
  category: 'data',
  route: 'data-builder',
  thumbnail: '/assets/thumbnails/data-builder.png',
  tags: ['data', 'mock data', 'generator', 'json', 'xml', 'schema', 'testing', 'seed data', 'blueprint'],
  isNew: false,
  isFeatured: false,
  wasmPowered: false,
  pythonPowered: false,
  status: 'beta',
  addedAt: '2025-01-01',
  mobileOptimized: false,
};
