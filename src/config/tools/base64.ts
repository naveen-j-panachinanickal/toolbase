import { ToolMeta } from "@/types/tool-search";

export const base64Config: ToolMeta = {
  id: 'base64',
  name: 'Base64',
  description: 'Encode and decode text, files and images to and from Base64.',
  longDescription:
    'Instantly encode any text, file or image to Base64, or decode Base64 strings back to their original form. Supports URL-safe Base64, handles binary files, and processes everything locally with no size limits imposed by server uploads.',
  category: 'developer',
  route: 'base64',
  thumbnail: '/assets/thumbnails/base-64.png',
  tags: ['base64', 'encode', 'decode', 'binary', 'text', 'image', 'file', 'url-safe'],
  isNew: false,
  isFeatured: false,
  wasmPowered: false,
  pythonPowered: false,
  status: 'stable',
  addedAt: '2025-01-01',
  mobileOptimized: true,
  tip: [
    {
      id: 'base64/encode',
      name: 'Base64 Encode',
      description: 'Convert any file or text into a Base64 encoded string.',
      consumes: ['application/octet-stream', 'text/plain', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'],
      produces: ['text/plain'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          { key: 'urlSafe', label: 'URL Safe', type: 'boolean', default: false },
          { key: 'addMimeHeader', label: 'Add MIME Header', type: 'boolean', default: false },
        ]
      },
      interactable: true as const,
      getInteractionComponent: async () => {
        const { default: Base64Interactive } = await import('@/components/features/base64/Base64Interactive');
        return Base64Interactive;
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { base64Worker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          base64Worker,
          'process',
          (uint8, config) => ({
            mode: 'file_encode',
            data: uint8,
            url_safe: !!config.urlSafe,
            mime_type: config.addMimeHeader ? (config.mimeType as string || 'application/octet-stream') : '',
          }),
          () => 'text/plain',
          'Base64 Encode'
        );
      }
    },
    {
      id: 'base64/decode',
      name: 'Base64 Decode',
      description: 'Decode a Base64 string back into its original file.',
      consumes: ['text/plain'],
      produces: ['application/octet-stream'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          { key: 'urlSafe', label: 'URL Safe', type: 'boolean', default: false },
        ]
      },
      interactable: true as const,
      getInteractionComponent: async () => {
        const { default: Base64Interactive } = await import('@/components/features/base64/Base64Interactive');
        return Base64Interactive;
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { base64Worker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          base64Worker,
          'process',
          (uint8, config) => ({
            mode: 'file_decode',
            data: uint8,
            url_safe: !!config.urlSafe,
          }),
          () => 'application/octet-stream',
          'Base64 Decode'
        );
      }
    }
  ]
};
