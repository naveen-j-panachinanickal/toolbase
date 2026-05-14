import type { Metadata } from "next";
import { ToolPageTracker } from "@/components/ui/ToolPageTracker";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";

export const metadata: Metadata = {
  title: "NoteVault | toolbase",
  description: "A developer-centric local note taking tool. Store JSON, XML, Markdown, and Code securely in your browser.",
  keywords: ["notes", "snippets", "json", "markdown", "code", "local", "private"],
};

export default function NoteVaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ToolPageTracker toolId="note-vault" />
      <PrivacyBadge toolId="note-vault" />
      {children}
    </>
  );
}
