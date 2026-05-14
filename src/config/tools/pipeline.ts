import { ToolMeta } from "@/types/tool-search";
import { TIP_CONTENT_TYPES } from "@/tip/protocol";

export const pipelineConfig: ToolMeta = {
  id: 'pipeline',
  name: 'Pipeline Builder',
  description: 'Chain any tools together into an automated workflow. Powered by TIP.',
  longDescription:
    'Pipeline Builder lets you chain Toolbase tools together into reusable automated workflows. Compress a PDF, extract images, then compress those — in one click. Powered by the Toolbase Interoperability Protocol (TIP). All processing stays in your browser.',
  category: 'developer',
  route: 'pipeline',
  thumbnail: '/assets/thumbnails/pipeline.png',
  tags: ['pipeline', 'chain', 'workflow', 'automate', 'tip', 'batch', 'combine'],
  isNew: true,
  isFeatured: true,
  wasmPowered: true,
  pythonPowered: true,
  status: 'beta',
  addedAt: '2026-02-27',
  mobileOptimized: false,
  tip: [
    {
      id: 'system/human-review',
      name: 'Human Review',
      description: 'Pause the pipeline for manual data approval.',
      consumes: [...TIP_CONTENT_TYPES],
      produces: [...TIP_CONTENT_TYPES],
      configSchema: { fields: [] },
      mobileOptimized: false,
      interactable: true as const,
      getInteractionComponent: async () => {
        const { default: HumanReviewInteraction } = await import('@/components/features/pipeline/nodes/HumanReviewInteraction');
        return HumanReviewInteraction;
      },
      getExecutor: async () => {
        return async (input, config) => {
          const { ReviewSync } = await import('@/lib/review-sync');
          const nodeId = config.__nodeId as string;
          if (!nodeId) {
            // Fallback if nodeId not injected
            return input;
          }
          return ReviewSync.requestReview(nodeId, input);
        };
      }
    }
  ]
};
