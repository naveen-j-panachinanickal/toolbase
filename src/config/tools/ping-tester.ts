import { ToolMeta } from "@/types/tool-search";

export const pingTesterConfig: ToolMeta = {
  id: 'ping-tester',
  name: 'Ping Tester',
  description: 'Test network latency and reachability of any host directly from your browser.',
  longDescription:
    'Test network latency and check if hosts are reachable directly from your browser. Useful for quick network diagnostics without installing command-line tools.',
  category: 'network',
  route: 'ping-tester',
  thumbnail: '/assets/thumbnails/ping-tester.png',
  tags: ['ping', 'network', 'latency', 'connectivity', 'host', 'diagnostic'],
  isNew: false,
  isFeatured: false,
  wasmPowered: false,
  pythonPowered: false,
  status: 'beta',
  addedAt: '2025-01-01',
  mobileOptimized: true,
};
