import { ToolMeta } from "@/types/tool-search";

export const speedTestConfig: ToolMeta = {
  id: 'speed-test',
  name: 'Speed Test',
  description: 'Test your internet connection download and upload speed.',
  longDescription:
    'Measure your real internet connection speed with download and upload tests. Get accurate results directly in your browser without installing any extensions or apps.',
  category: 'network',
  route: 'speed-test',
  thumbnail: '/assets/thumbnails/speed-test.png',
  tags: ['speed', 'network', 'internet', 'download', 'upload', 'bandwidth', 'test'],
  isNew: false,
  isFeatured: false,
  wasmPowered: false,
  pythonPowered: false,
  status: 'beta',
  addedAt: '2025-01-01',
  mobileOptimized: true,
};
