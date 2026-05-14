import { ToolMeta } from "@/types/tool-search";

export const formatStudioConfig: ToolMeta = {
  id: 'format-studio',
  name: 'Format Studio',
  description: 'Convert, validate, and format JSON/XML/YAML/TOML with visual schema and graph generation.',
  longDescription:
    'Format Studio is a browser-native structured data toolbase for converting formats, validating payloads, formatting content, and generating markdown or graph documentation from JSON, XML, and YAML.',
  category: 'data',
  route: 'format-studio',
  thumbnail: '/assets/thumbnails/format-studio.png',
  tags: ['data', 'json', 'xml', 'yaml', 'toml', 'convert', 'validate', 'formatter', 'schema', 'graph'],
  isNew: false,
  isFeatured: false,
  wasmPowered: false,
  pythonPowered: false,
  status: 'beta',
  addedAt: '2025-01-01',
  mobileOptimized: false,
  tip: [
    {
      id: 'format-studio/beautify',
      name: 'Beautify',
      description: 'Format and indent JSON, XML, or YAML for readability.',
      consumes: ['application/json', 'text/plain'],
      produces: ['text/plain'],
      mobileOptimized: false,
      configSchema: {
        fields: [
          {
            key: 'format',
            label: 'Format',
            type: 'select',
            default: 'json',
            options: [
              { label: 'JSON', value: 'json' },
              { label: 'XML', value: 'xml' },
              { label: 'YAML', value: 'yaml' },
            ],
          },
        ],
      },
      getExecutor: async () => {
        const { createFormatStudioTipExecutor } = await import('@/tip/format-studio-executor');
        return createFormatStudioTipExecutor('beautify');
      },
    },
    {
      id: 'format-studio/minify',
      name: 'Minify',
      description: 'Remove all whitespace and comments to compress the payload.',
      consumes: ['application/json', 'text/plain'],
      produces: ['text/plain'],
      mobileOptimized: false,
      configSchema: {
        fields: [
          {
            key: 'format',
            label: 'Format',
            type: 'select',
            default: 'json',
            options: [
              { label: 'JSON', value: 'json' },
              { label: 'XML', value: 'xml' },
              { label: 'YAML', value: 'yaml' },
            ],
          },
        ],
      },
      getExecutor: async () => {
        const { createFormatStudioTipExecutor } = await import('@/tip/format-studio-executor');
        return createFormatStudioTipExecutor('minify');
      },
    },
    {
      id: 'format-studio/clean',
      name: 'Clean Payload',
      description: 'Recursively remove nulls, undefineds, and empty collections.',
      consumes: ['application/json', 'text/plain'],
      produces: ['application/json'],
      mobileOptimized: false,
      configSchema: {
        fields: [
          {
            key: 'format',
            label: 'Format',
            type: 'select',
            default: 'json',
            options: [
              { label: 'JSON', value: 'json' },
              { label: 'XML', value: 'xml' },
              { label: 'YAML', value: 'yaml' },
            ],
          },
        ],
      },
      getExecutor: async () => {
        const { createFormatStudioTipExecutor } = await import('@/tip/format-studio-executor');
        return createFormatStudioTipExecutor('clean');
      },
    },
    {
      id: 'format-studio/normalize',
      name: 'Normalize Keys',
      description: 'Transform all object keys to camelCase for consistency.',
      consumes: ['application/json', 'text/plain'],
      produces: ['application/json'],
      mobileOptimized: false,
      configSchema: {
        fields: [
          {
            key: 'format',
            label: 'Format',
            type: 'select',
            default: 'json',
            options: [
              { label: 'JSON', value: 'json' },
              { label: 'XML', value: 'xml' },
              { label: 'YAML', value: 'yaml' },
            ],
          },
        ],
      },
      getExecutor: async () => {
        const { createFormatStudioTipExecutor } = await import('@/tip/format-studio-executor');
        return createFormatStudioTipExecutor('normalize');
      },
    },
  ],
};
