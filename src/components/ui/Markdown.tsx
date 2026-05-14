import React, { useMemo } from "react";
import { marked } from "marked";
import { cn } from "@/lib/utils";

interface MarkdownProps {
    content: string;
    className?: string;
}

/**
 * A robust Markdown renderer using the 'marked' library.
 * Designed to fit the Toolbase design system with support for 
 * code blocks, lists, and bold text.
 */
export function Markdown({ content, className }: MarkdownProps) {
    const html = useMemo(() => {
        try {
            // Synchronous parsing for immediate UI updates
            return marked.parse(content, { 
                breaks: true,
                gfm: true,
                async: false
            }) as string;
        } catch (e) {
            console.error("Markdown parsing error:", e);
            return content;
        }
    }, [content]);

    return (
        <div 
            className={cn(
                "markdown-content prose prose-sm max-w-none break-words",
                "text-(--text-primary) leading-relaxed",
                "[&_p]:mb-4 [&_p:last-child]:mb-0",
                "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-4",
                "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6",
                "[&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4",
                "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4",
                "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4",
                "[&_li]:mb-1",
                "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:bg-(--surface-hover) [&_code]:text-blue-500 [&_code]:font-mono [&_code]:text-[0.9em]",
                "[&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:bg-(--surface-secondary) [&_pre]:border [&_pre]:border-(--border-subtle) [&_pre]:overflow-x-auto [&_pre]:mb-4",
                "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-(--text-secondary) [&_pre_code]:text-sm",
                "[&_blockquote]:border-l-4 [&_blockquote]:border-blue-500/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-(--text-muted) [&_blockquote]:mb-4",
                "[&_a]:text-blue-500 [&_a]:underline [&_a]:hover:text-blue-400",
                "[&_table]:w-full [&_table]:mb-4 [&_table]:border-collapse",
                "[&_th]:border [&_th]:border-(--border-subtle) [&_th]:p-2 [&_th]:bg-(--surface-hover) [&_th]:text-left",
                "[&_td]:border [&_td]:border-(--border-subtle) [&_td]:p-2",
                "[&_hr]:border-t [&_hr]:border-(--border-subtle) [&_hr]:my-6",
                className
            )}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
