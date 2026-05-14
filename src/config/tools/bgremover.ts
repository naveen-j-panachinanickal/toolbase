import { ToolMeta } from "@/types/tool-search";

export const bgremoverConfig: ToolMeta = {
  id: 'bgremover',
  name: 'Background Remover',
  description: 'Remove image backgrounds instantly and for free using AI in your browser.',
  longDescription:
    'Background Remover is a privacy-first tool that uses advanced AI models to detect and remove backgrounds from your images locally. Your data never leaves your machine, ensuring maximum privacy and high-speed processing without needing a server.',
  category: 'image',
  route: 'bgremover',
  thumbnail: '/assets/thumbnails/bgremover.png',
  tags: ['image', 'background', 'remove', 'ai', 'png', 'jpg', 'webp'],
  isNew: true,
  isFeatured: true,
  wasmPowered: true,
  pythonPowered: false,
  status: 'stable',
  addedAt: '2025-05-14',
  mobileOptimized: true,
  tip: [] // Handled by standalone page for now
};
