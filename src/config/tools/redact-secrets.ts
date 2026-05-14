import { ToolMeta } from "@/types/tool-search";

export const redactSecretsConfig: ToolMeta = {
  id: 'redact-secrets',
  name: 'Redact Secrets',
  description: 'Automatically detect and redact API keys, passwords and sensitive data from files.',
  longDescription:
    'Redact Secrets scans text, code, config files and documents for sensitive information — API keys, passwords, tokens, private keys, credit card numbers — and redacts them. Perfect for sanitizing files before sharing. All scanning happens locally in your browser.',
  category: 'security',
  route: 'redact-secrets',
  thumbnail: '/assets/thumbnails/redact-secrets.png',
  tags: ['redact', 'secrets', 'api-keys', 'passwords', 'tokens', 'security', 'privacy', 'scan'],
  isNew: false,
  isFeatured: true,
  wasmPowered: true,
  pythonPowered: false,
  status: 'stable',
  addedAt: '2025-01-01',
  mobileOptimized: true,
  tip: [
    {
      id: 'redact-secrets/redact',
      name: 'Redact Secrets',
      description: 'Automatically detect and redact API keys, passwords and sensitive data from files.',
      consumes: ['text/plain', 'application/json', 'text/csv', 'application/octet-stream'],
      produces: ['text/plain'],
      configSchema: {
        fields: []
      },
      mobileOptimized: true,
      interactable: true as const,
      getInteractionComponent: async () => {
        const { default: RedactInteractive } = await import('@/components/features/redact-secrets/RedactInteractive');
        return RedactInteractive;
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { redactSecretsWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          redactSecretsWorker,
          'redact',
          (uint8, config) => {
            const content = new TextDecoder().decode(uint8);
            return {
              content,
              contentType: (config.contentType as any) || 'text',
              customConfigurations: {
                style: (config.maskingStyle as any) || 'partial',
                userHints: {
                  keys: (config.keys as string[]) || [],
                  literalTexts: (config.literalTexts as string[]) || [],
                  regexPatterns: (config.regexPatterns as string[]) || [],
                }
              }
            };
          },
          () => 'text/plain',
          'Redact Secrets'
        );
      }
    }
  ]
};
