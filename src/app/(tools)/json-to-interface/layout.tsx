import type { Metadata } from "next";
import { ToolPageTracker } from '@/components/ui/ToolPageTracker';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';

export const metadata: Metadata = {
    title: "JSON to Interface | TypeScript, Go, Java, Python",
    description: "Instantly convert JSON objects into type-safe interfaces and models for TypeScript, Go, Java, Python, and more. Runs locally in your browser.",
    keywords: ["json to typescript", "json listener", "json to interface", "json to struct", "code generator", "developer productivity"],
};

export default function JsonToInterfaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <ToolPageTracker toolId="json-to-interface" />
            <PrivacyBadge toolId="json-to-interface" />
            {children}
        </>
    );
}
