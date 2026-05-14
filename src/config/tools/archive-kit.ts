import { ToolMeta } from "@/types/tool-search";

export const archiveKitConfig: ToolMeta = {
  id: 'archive-kit',
  name: 'Archive Kit',
  description: 'Create, inspect, and extract ZIP/TAR archives entirely in your browser.',
  longDescription:
    'Archive Kit helps you package files into ZIP/TAR archives, inspect archive contents, and extract files locally in your browser. It is designed for private, client-side workflows where no data should leave your machine.',
  category: 'developer',
  route: 'archive-kit',
  thumbnail: '/assets/thumbnails/archive-kit.png',
  tags: ['archive', 'zip', 'tar', 'extract', 'list', 'pack', 'unpack', 'developer'],
  isNew: true,
  isFeatured: false,
  wasmPowered: true,
  pythonPowered: false,
  status: 'beta',
  addedAt: '2026-03-05',
  mobileOptimized: false,
};
