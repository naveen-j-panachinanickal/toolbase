import { ToolMeta } from "@/types/tool-search";

export const magicPdfConfig: ToolMeta = {
  id: 'magic-pdf',
  name: 'Magic PDF',
  description: 'Compress, merge, split, protect, sign and convert PDFs — all in your browser.',
  longDescription:
    'Magic PDF is a full-featured PDF toolbase that runs entirely in your browser using WebAssembly. Compress PDFs without quality loss, merge multiple files, split by page range, add password protection, sign documents, convert to images, and more. No file ever leaves your machine.',
  category: 'pdf',
  route: 'magic-pdf',
  thumbnail: '/assets/thumbnails/magic-pdf.png',
  tags: ['pdf', 'compress', 'merge', 'split', 'protect', 'sign', 'convert', 'word', 'image'],
  isNew: false,
  isFeatured: true,
  wasmPowered: true,
  pythonPowered: true,
  status: 'stable',
  addedAt: '2025-01-01',
  mobileOptimized: true,
  tip: [
    {
      id: 'magic-pdf/compress',
      name: 'Compress PDF',
      description: 'Reduce PDF file size while preserving quality.',
      consumes: ['application/pdf'],
      produces: ['application/pdf'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          {
            key: 'level',
            label: 'Compression Level',
            type: 'select',
            default: 'recommended',
            description: 'Extreme: 70-90% smaller (pages → images). Recommended: 40-60%. Less: high quality, smaller reduction.',
            options: [
              { label: 'Extreme (70–90% smaller)', value: 'extreme' },
              { label: 'Recommended (40–60% smaller)', value: 'recommended' },
              { label: 'Less compression (high quality)', value: 'less' },
            ],
          },
        ]
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { magicPdfWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(magicPdfWorker, 'compress', (b, c) => ({ file_bytes: b, level: c.level ?? 'recommended' }), () => 'application/pdf', 'Compress PDF');
      }
    },
    {
      id: 'magic-pdf/split',
      name: 'Split PDF',
      description: 'Split a PDF into individual pages or custom page ranges.',
      consumes: ['application/pdf'],
      produces: ['application/pdf'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          {
            key: 'pageRanges',
            label: 'Page Ranges',
            type: 'string',
            default: '',
            description:
              'Comma-separated ranges e.g. "1-3,5,7-9". Leave blank to split every page.',
          },
        ]
      },
      // INP: visual page-selector interaction to set split points
      interactable: true as const,
      getInteractionComponent: async () => {
        const { default: SplitPdf } = await import('@/components/features/magic-pdf/SplitPdf');
        return SplitPdf;
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { magicPdfWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(magicPdfWorker, 'split', (b, c) => ({ file_bytes: b, page_ranges: c.pageRanges || '' }), () => 'application/pdf', 'Split PDF');
      }
    },
    {
      id: 'magic-pdf/merge',
      name: 'Merge PDFs',
      description: 'Merge multiple PDF files into a single PDF document.',
      consumes: ['application/pdf'],
      produces: ['application/pdf'],
      mobileOptimized: true,
      configSchema: { fields: [] },
      // INP: requires user interaction to set file order before execution
      interactable: true as const,
      getInteractionComponent: async () => {
        const { default: MergePdf } = await import('@/components/features/magic-pdf/MergePdf');
        return MergePdf;
      },
      getExecutor: async () => {
        const { createBatchTIPExecutor } = await import('@/tip/executor');
        const { magicPdfWorker } = await import('@/workers/instances');
        return createBatchTIPExecutor(magicPdfWorker, 'merge', (b, c) => ({ files_bytes: b, ...c }), () => 'application/pdf', 'Merge PDFs', 'merged.pdf');
      }
    },
    {
      id: 'magic-pdf/rearrange',
      name: 'Rearrange PDF',
      description: 'Reorder, rotate, and remove pages from a PDF.',
      consumes: ['application/pdf'],
      produces: ['application/pdf'],
      mobileOptimized: true,
      // No configSchema fields — all config set via the INP visual page picker
      configSchema: { fields: [] },
      // INP: visual drag-and-drop page picker
      interactable: true as const,
      getInteractionComponent: async () => {
        const { default: RearrangePdf } = await import('@/components/features/magic-pdf/RearrangePdf');
        return RearrangePdf;
      },
      // Pure pdf-lib executor — no Python WASM needed
      getExecutor: async () => {
        return async (input: import('@/tip/protocol').TIPBundle, config: import('@/tip/protocol').TIPConfig) => {
          const { rearrangePdf } = await import('@/lib/pdf-actions');
          const { bundleFromFile } = await import('@/tip/bundle');
          const payload = input.payloads[0];
          const file = new File([payload.data], payload.meta.filename || 'input.pdf', { type: 'application/pdf' });
          const pageOrder = JSON.parse((config.pageOrder as string) || '[]') as number[];
          const operations = JSON.parse((config.operations as string) || '[]');
          const resultBytes = await rearrangePdf(file, pageOrder, operations);
          const resultFile = new File([resultBytes as any], `rearranged_${payload.meta.filename ?? 'output.pdf'}`, { type: 'application/pdf' });
          return bundleFromFile(resultFile);
        };
      }
    },
    {
      id: 'magic-pdf/protect',
      name: 'Protect PDF',
      description: 'Password-protect a PDF so it requires a password to open.',
      consumes: ['application/pdf'],
      produces: ['application/pdf'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          {
            key: 'password',
            label: 'User Password',
            type: 'password',
            default: '',
            required: true,
            description: 'Required to open the PDF.',
          },
          {
            key: 'owner_password',
            label: 'Owner Password',
            type: 'password',
            default: '',
            description: 'Optional. Allows changing permissions. Defaults to user password if empty.',
          },
          {
            key: 'allowPrinting',
            label: 'Allow Printing',
            type: 'boolean',
            default: true,
            description: 'Users can print the document.',
          },
          {
            key: 'allowModifying',
            label: 'Allow Modifying',
            type: 'boolean',
            default: false,
            description: 'Users can edit the document content.',
          },
          {
            key: 'allowCopying',
            label: 'Allow Copying',
            type: 'boolean',
            default: false,
            description: 'Users can copy text and images.',
          },
          {
            key: 'allowAnnotating',
            label: 'Allow Annotating',
            type: 'boolean',
            default: true,
            description: 'Users can add comments and annotations.',
          },
          {
            key: 'allowFillingForms',
            label: 'Allow Filling Forms',
            type: 'boolean',
            default: true,
            description: 'Users can fill in form fields.',
          },
        ]
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { magicPdfWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          magicPdfWorker,
          'protect',
          (b, c) => ({
            file_bytes: b,
            password: c.password,
            owner_password: c.owner_password || c.password,
            permissions: JSON.stringify({
              printing: c.allowPrinting !== false,
              modifying: c.allowModifying === true,
              copying: c.allowCopying === true,
              annotating: c.allowAnnotating !== false,
              fillingForms: c.allowFillingForms !== false,
              accessibility: true,
            }),
          }),
          () => 'application/pdf',
          'Protect PDF'
        );
      }
    },
    {
      id: 'magic-pdf/unlock',
      name: 'Unlock PDF',
      description: 'Remove password protection from a PDF.',
      consumes: ['application/pdf'],
      produces: ['application/pdf'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          {
            key: 'password',
            label: 'PDF Password',
            type: 'password',
            default: '',
            required: false,
            description: 'Password to unlock the PDF.',
          },
        ]
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { magicPdfWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          magicPdfWorker,
          'unlock',
          (b, c) => ({ file_bytes: b, password: c.password || '' }),
          () => 'application/pdf',
          'Unlock PDF'
        );
      },
      interactable: true as const,
      getInteractionComponent: async () => {
        const { default: UnlockPdf } = await import('@/components/features/magic-pdf/UnlockPdf');
        return UnlockPdf;
      },
    },
    {
      id: 'magic-pdf/mask',
      name: 'Redact & Mask',
      description: 'Permanently remove sensitive information, PII, and secrets from your documents.',
      consumes: ['application/pdf'],
      produces: ['application/pdf'],
      mobileOptimized: true,
      configSchema: { fields: [] },
      interactable: true as const,
      getInteractionComponent: async () => {
        const { default: MaskPdf } = await import('@/components/features/magic-pdf/MaskPdf');
        return MaskPdf;
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { magicPdfWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          magicPdfWorker,
          'apply_edits',
          (b, c) => ({
            file_bytes: b,
            edits: (c.edits as any[])?.map(el => ({
              ...el,
            })) || []
          }),
          () => 'application/pdf',
          'Redact & Mask'
        );
      }
    },
    {
      id: 'magic-pdf/sign',
      name: 'Sign PDF',
      description: 'Add hand-drawn, typed, or image signatures to a PDF.',
      consumes: ['application/pdf'],
      produces: ['application/pdf'],
      mobileOptimized: true,
      // No configSchema fields — all config set via the INP signature canvas
      configSchema: { fields: [] },
      // INP: full signature draw/type/upload + drag-to-place UI
      interactable: true as const,
      getInteractionComponent: async () => {
        const { default: SignPdf } = await import('@/components/features/magic-pdf/SignPdf');
        return SignPdf;
      },
      // Pure pdf-lib executor — no Python WASM needed
      getExecutor: async () => {
        return async (input: import('@/tip/protocol').TIPBundle, config: import('@/tip/protocol').TIPConfig) => {
          const { PDFDocument } = await import('pdf-lib');
          const { bundleFromFile } = await import('@/tip/bundle');
          const payload = input.payloads[0];
          const fileBytes = await payload.data.arrayBuffer();
          const pdfDoc = await PDFDocument.load(fileBytes);
          const signatures: Array<{
            dataUrl: string; x: number; y: number;
            width: number; height: number; pageIndex: number;
          }> = JSON.parse((config.signatures as string) || '[]');

          for (const sig of signatures) {
            const sigImgBytes = await fetch(sig.dataUrl).then(r => r.arrayBuffer());
            const sigImg = sig.dataUrl.includes('image/png')
              ? await pdfDoc.embedPng(sigImgBytes)
              : await pdfDoc.embedJpg(sigImgBytes);

            const pages = pdfDoc.getPages();
            const page = pages[sig.pageIndex] ?? pages[0];
            const { width: pW, height: pH } = page.getSize();

            const realX = (sig.x / 100) * pW - ((sig.width / 100) * pW) / 2;
            const topY = (sig.y / 100) * pH;
            const realH = (sig.height / 100) * pH;
            const realW = (sig.width / 100) * pW;
            const realY = pH - topY - realH / 2;

            page.drawImage(sigImg, { x: realX, y: realY, width: realW, height: realH });
          }

          const finalBytes = await pdfDoc.save();
          const resultFile = new File(
            [finalBytes as any],
            `signed_${payload.meta.filename ?? 'output.pdf'}`,
            { type: 'application/pdf' }
          );
          return bundleFromFile(resultFile);
        };
      }
    },
    {
      id: 'magic-pdf/pdf-to-images',
      name: 'PDF to Images',
      description: 'Convert each PDF page to a PNG image. Output is one image per page.',
      consumes: ['application/pdf'],
      produces: ['image/png', 'image/jpeg'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          {
            key: 'dpi',
            label: 'Resolution',
            type: 'number',
            default: 150,
            min: 72,
            max: 600,
            step: 1,
            unit: 'DPI',
            description: 'Higher DPI = sharper images, larger files.',
          },
          {
            key: 'format',
            label: 'Format',
            type: 'select',
            default: 'PNG',
            options: [
              { label: 'PNG', value: 'PNG' },
              { label: 'JPEG', value: 'JPEG' },
            ]
          }
        ]
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { magicPdfWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          magicPdfWorker,
          'pdf_to_images',
          (b, c) => ({ file_bytes: b, format: c.format || 'PNG', ...c }),
          (p, c) => (c.format === 'JPEG' ? 'image/jpeg' : 'image/png'),
          'PDF to Images'
        );
      }
    },
    {
      id: 'magic-pdf/images-to-pdf',
      name: 'Images to PDF',
      description: 'Convert multiple images into a single PDF document.',
      consumes: ['image/png', 'image/jpeg', 'image/webp'],
      produces: ['application/pdf'],
      mobileOptimized: true,
      configSchema: { fields: [] },
      getExecutor: async () => {
        const { createBatchTIPExecutor } = await import('@/tip/executor');
        const { magicPdfWorker } = await import('@/workers/instances');
        return createBatchTIPExecutor(magicPdfWorker, 'images_to_pdf', (b, c) => ({ files_bytes: b, ...c }), () => 'application/pdf', 'Images to PDF', 'images.pdf');
      }
    },
    {
      id: 'magic-pdf/pdf-to-word',
      name: 'PDF to Word',
      description: 'Convert a PDF into an editable Word Document.',
      consumes: ['application/pdf'],
      produces: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      mobileOptimized: true,
      configSchema: { fields: [] },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { magicPdfWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(magicPdfWorker, 'pdf_to_word', (b, c) => ({ file_bytes: b, ...c }), () => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'PDF to Word');
      }
    }
  ]
};
