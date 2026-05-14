import { ToolMeta } from "@/types/tool-search";

export const passwordxConfig: ToolMeta = {
  id: 'passwordx',
  name: 'PasswordX',
  description: 'Generate secure passwords and test their strength.',
  longDescription:
    'Generate secure passwords and test their strength. Get accurate results directly in your browser without installing any extensions or apps.',
  category: 'security',
  route: 'passwordx',
  thumbnail: '/assets/thumbnails/passwordx.png',
  tags: ['password', 'security', 'generate', 'test', 'secure', 'passwordx'],
  isNew: false,
  isFeatured: false,
  wasmPowered: false,
  pythonPowered: false,
  status: 'beta',
  addedAt: '2025-01-01',
  mobileOptimized: true,
};
