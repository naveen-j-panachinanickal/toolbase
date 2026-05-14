import type { Metadata } from 'next';
import { ToolPageTracker } from '@/components/ui/ToolPageTracker';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';

export const metadata: Metadata = {
    title: 'Magic PDF | OBN toolbase',
    description: 'Securely merge, split, compress, and manage PDF documents with browser-based tools.',
};

export default function MagicPdfLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <ToolPageTracker toolId="magic-pdf" />
            <PrivacyBadge toolId="magic-pdf" />
            {children}
        </>
    );
}
