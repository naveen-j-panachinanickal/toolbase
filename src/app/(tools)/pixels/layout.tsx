import type { Metadata } from 'next';
import { ToolPageTracker } from '@/components/ui/ToolPageTracker';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';

export const metadata: Metadata = {
  title: 'Pixels | Professional Image Studio',
  description:
    'Pixels is a browser-native image suite. Compress, resize, upscale, and apply steganography to your images with 100% privacy.',
  keywords: [
    'image compressor',
    'image resizer',
    'image upscale',
    'steganography',
    'offline image tools',
    'secure image tool',
    'client-side image processing',
  ],
  authors: [{ name: 'ToolBase' }],
  openGraph: {
    title: 'Pixels | Professional Image Studio',
    description: 'Compress, resize, and upscale images securely in your browser without uploading files.',
    type: 'website',
  },
};

export default function PixelsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ToolPageTracker toolId="pixels" />
      <PrivacyBadge toolId="pixels" />
      {children}
    </>
  );
}
