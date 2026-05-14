import { ToolMeta } from "@/types/tool-search";

export const pixelsConfig: ToolMeta = {
  id: 'pixels',
  name: 'Pixels',
  description: 'Compress, resize, upscale images and hide messages with steganography.',
  longDescription:
    'Pixels is a powerful image processing toolbase. Compress images without visible quality loss, resize to exact dimensions, upscale with AI-like algorithms, and even hide secret messages inside images using steganography — all processed locally in your browser.',
  category: 'image',
  route: 'pixels',
  thumbnail: '/assets/thumbnails/pixels.png',
  tags: ['image', 'compress', 'resize', 'upscale', 'steganography', 'png', 'jpg', 'webp'],
  isNew: false,
  isFeatured: true,
  wasmPowered: true,
  pythonPowered: true,
  status: 'stable',
  addedAt: '2025-01-01',
  mobileOptimized: true,
  tip: [
    {
      id: 'pixels/compress',
      name: 'Compress Images',
      description: 'Compress PNG, JPEG, or WebP images to reduce file size.',
      consumes: ['image/png', 'image/jpeg', 'image/webp'],
      produces: ['image/png', 'image/jpeg', 'image/webp'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          {
            key: 'quality',
            label: 'Quality',
            type: 'number',
            default: 80,
            min: 1,
            max: 100,
            step: 1,
            unit: '%',
            description: 'Higher = better quality, larger file.',
          },
          {
            key: 'format',
            label: 'Output Format',
            type: 'select',
            default: 'JPEG',
            options: [
              { label: 'JPEG', value: 'JPEG' },
              { label: 'PNG', value: 'PNG' },
              { label: 'WEBP', value: 'WEBP' },
            ],
            description: 'Output image format.',
          },
          {
            key: 'resizeFactor',
            label: 'Image Scale',
            type: 'number',
            default: 1.0,
            min: 0.1,
            max: 1.0,
            step: 0.1,
            unit: '×',
            description: 'Scale the image before compression (1.0 = original size).',
          },
          {
            key: 'enhance',
            label: 'Auto Enhance',
            type: 'boolean',
            default: false,
            description: 'Apply subtle auto-enhancement to contrast and sharpness.',
          },
          {
            key: 'stripMetadata',
            label: 'Strip Metadata',
            type: 'boolean',
            default: true,
            description: 'Remove GPS, camera, and EXIF data from the output image.',
          },
        ]
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { pixelsWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          pixelsWorker,
          'compress',
          // Explicit mapping: JS camelCase → Python snake_case
          (buffer, config) => ({
            image_data: buffer,
            quality: config.quality,
            format: config.format,
            resize_factor: config.resizeFactor,
            enhance: config.enhance,
            strip_metadata: config.stripMetadata,
          }),
          (payload, config) => (config.format ? `image/${String(config.format).toLowerCase()}` as any : payload.contentType),
          'Compress Images'
        );
      }
    },
    {
      id: 'pixels/resize',
      name: 'Resize Images',
      description: 'Resize images to a specific width and height.',
      consumes: ['image/png', 'image/jpeg', 'image/webp'],
      produces: ['image/png', 'image/jpeg', 'image/webp'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          {
            key: 'width',
            label: 'Width',
            type: 'number',
            default: 1920,
            min: 1,
            max: 8192,
            step: 1,
            unit: 'px',
          },
          {
            key: 'height',
            label: 'Height',
            type: 'number',
            default: 1080,
            min: 1,
            max: 8192,
            step: 1,
            unit: 'px',
          },
          {
            key: 'quality',
            label: 'Quality',
            type: 'number',
            default: 90,
            min: 1,
            max: 100,
            step: 1,
            unit: '%',
          },
          {
            key: 'format',
            label: 'Output Format',
            type: 'select',
            default: 'JPEG',
            options: [
              { label: 'JPEG', value: 'JPEG' },
              { label: 'PNG', value: 'PNG' },
              { label: 'WEBP', value: 'WEBP' },
            ],
          },
          {
            key: 'mode',
            label: 'Fit Mode',
            type: 'select',
            default: 'stretch',
            options: [
              { label: 'Stretch (exact fit)', value: 'stretch' },
              { label: 'Contain (letterbox)', value: 'contain' },
            ],
          },
          {
            key: 'fillColor',
            label: 'Fill Color',
            type: 'string',
            default: 'transparent',
            description: 'Background fill color when fit mode is Contain (hex or "transparent").',
          },
        ]
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { pixelsWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          pixelsWorker,
          'resize',
          // Explicit mapping: JS camelCase → Python snake_case
          (buffer, config) => ({
            image_data: buffer,
            width: config.width,
            height: config.height,
            quality: config.quality,
            format: config.format,
            mode: config.mode,
            fill_color: config.fillColor,
          }),
          (payload, config) => (config.format ? `image/${String(config.format).toLowerCase()}` as any : payload.contentType),
          'Resize Images'
        );
      }
    },
    {
      id: 'pixels/upscale',
      name: 'Upscale Images',
      description: 'Upscale images to a larger size with quality enhancement. Always outputs PNG.',
      consumes: ['image/png', 'image/jpeg', 'image/webp'],
      produces: ['image/png'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          {
            key: 'resizeFactor',
            label: 'Scale Factor',
            type: 'number',
            default: 2.0,
            min: 1.0,
            max: 4.0,
            step: 0.25,
            unit: '×',
            description: 'How much to enlarge the image.',
          },
          {
            key: 'quality',
            label: 'Quality',
            type: 'number',
            default: 90,
            min: 1,
            max: 100,
            step: 1,
            unit: '%',
            description: 'Output image quality.',
          },
          {
            key: 'format',
            label: 'Output Format',
            type: 'select',
            default: 'PNG',
            options: [
              { label: 'PNG', value: 'PNG' },
              { label: 'JPEG', value: 'JPEG' },
              { label: 'WEBP', value: 'WEBP' },
            ],
            description: 'Output image format (PNG recommended for quality).',
          },
          {
            key: 'denoise',
            label: 'Reduce Noise',
            type: 'boolean',
            default: false,
            description: 'Apply median filter to smooth grain.',
          },
          {
            key: 'vibrant',
            label: 'Vibrant Colors',
            type: 'boolean',
            default: false,
            description: 'Boost saturation and contrast for punchier colors.',
          },
          {
            key: 'printDpi',
            label: 'Print Ready (300 DPI)',
            type: 'boolean',
            default: false,
            description: 'Set output DPI to 300 for print-quality output.',
          },
        ]
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { pixelsWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          pixelsWorker,
          'compress', // upscale goes through the 'compress' action in main.py (which routes to upscale_image when resize_factor > 1)
          // Explicit mapping: JS camelCase → Python snake_case
          (buffer, config) => ({
            image_data: buffer,
            quality: config.quality,
            format: config.format,
            resize_factor: config.resizeFactor,
            enhance: true, // always true for upscale
            denoise: config.denoise,
            vibrant: config.vibrant,
            print_dpi: config.printDpi,
          }),
          (payload, config) => (config.format ? `image/${String(config.format).toLowerCase()}` as any : 'image/png'),
          'Upscale Images'
        );
      }
    },
    {
      id: 'pixels/hide-data',
      name: 'Hide Data in Image',
      description: 'Hide a secret text message inside an image using steganography. Optionally encrypt it with a password.',
      consumes: ['image/png', 'image/jpeg', 'image/webp'],
      produces: ['image/png'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          {
            key: 'message',
            label: 'Secret Message',
            type: 'string',
            default: '',
            required: true,
          },
          {
            key: 'key',
            label: 'Encryption Key',
            type: 'string',
            default: '',
            description: 'Optional password to encrypt the message.',
          }
        ]
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { pixelsWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          pixelsWorker,
          'hide_text',
          (buffer, config) => ({ image_data: buffer, ...config }),
          () => 'image/png',
          'Hide Data'
        );
      }
    },
    {
      id: 'pixels/reveal-data',
      name: 'Reveal Data from Image',
      description: 'Extract and decrypt a hidden text message from an image.',
      consumes: ['image/png', 'image/jpeg', 'image/webp'],
      produces: ['text/plain'],
      mobileOptimized: true,
      configSchema: {
        fields: [
          {
            key: 'key',
            label: 'Decryption Key',
            type: 'string',
            default: '',
            description: 'Password to decrypt the message, if one was used during hiding.',
          }
        ]
      },
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { pixelsWorker } = await import('@/workers/instances');
        return createPerPayloadTIPExecutor(
          pixelsWorker,
          'reveal_text',
          (buffer, config) => ({ image_data: buffer, ...config }),
          () => 'text/plain',
          'Reveal Data'
        );
      }
    }
  ]
};
