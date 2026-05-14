import type { Metadata } from "next";
import { ToolPageTracker } from "@/components/ui/ToolPageTracker";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";

export const metadata: Metadata = {
  title: "Archive Kit | OBN",
  description: "Create, inspect, and extract ZIP/TAR archives entirely in your browser.",
  keywords: ["zip", "tar", "archive", "extract", "list", "compress", "browser local"],
};

export default function ArchiveKitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ToolPageTracker toolId="archive-kit" />
      <PrivacyBadge toolId="archive-kit" />
      {children}
    </>
  );
}

