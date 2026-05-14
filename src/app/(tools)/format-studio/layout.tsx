import type { Metadata } from "next";
import { ToolPageTracker } from "@/components/ui/ToolPageTracker";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";

export const metadata: Metadata = {
  title: "Format Studio | Structural Data Engine",
  description: "Format Studio converts, validates, and generates structured data formats entirely in the browser.",
  keywords: ["data converter", "json xml yaml toml csv", "schema validation", "data generator"],
};

export default function FormatStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ToolPageTracker toolId="format-studio" />
      <PrivacyBadge toolId="format-studio" />
      {children}
    </>
  );
}
