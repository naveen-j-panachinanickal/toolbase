import type { Metadata } from 'next';
import { ToolPageTracker } from '@/components/ui/ToolPageTracker';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';

export const metadata: Metadata = {
    title: 'Pipeline Builder | OBN toolbase',
    description: 'Chain Toolbase tools together into automated workflows powered by TIP — the Toolbase Interoperability Protocol.',
};

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <ToolPageTracker toolId="pipeline" />
            <PrivacyBadge toolId="pipeline" />
            {children}
        </>
    );
}
