import type { Metadata } from 'next';
import { ToolPageTracker } from '@/components/ui/ToolPageTracker';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';

export const metadata: Metadata = {
    title: 'Open Draw | OBN toolbase',
    description: 'Create diagrams, flowcharts and system designs with a full diagramming canvas — no account required.',
};

export default function OpenDrawLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <ToolPageTracker toolId="open-draw" />
            <PrivacyBadge toolId="open-draw" />
            {children}
        </>
    );
}
