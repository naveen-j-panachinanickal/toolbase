import type { Metadata } from 'next';
import { ToolPageTracker } from '@/components/ui/ToolPageTracker';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';

export const metadata: Metadata = {
    title: 'Ping Tester | OBN toolbase',
    description: 'Test network latency and reachability of any host directly from your browser.',
};

export default function PingTesterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <ToolPageTracker toolId="ping-tester" />
            <PrivacyBadge toolId="ping-tester" />
            {children}
        </>
    );
}
