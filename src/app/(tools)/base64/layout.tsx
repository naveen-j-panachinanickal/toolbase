import type { Metadata } from "next";
import { ToolPageTracker } from "@/components/ui/ToolPageTracker";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";

export const metadata: Metadata = {
    title: "Base64 Converter | Encode & Decode Files & Text",
    description: "Secure, client-side Base64 encoder and decoder. Convert images, files, and text to Base64 strings or decode them back instantly in your browser.",
    keywords: ["base64 encode", "base64 decode", "image to base64", "base64 to file", "local conversion", "privacy focused"],
};

export default function Base64Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <ToolPageTracker toolId="base64" />
            <PrivacyBadge toolId="base64" />
            {children}
        </>
    );
}
