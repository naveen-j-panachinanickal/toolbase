"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Slim nav button — returns user to the toolbase hub.
 * Shows the platform-aware keyboard shortcut (⌘K / Ctrl K).
 */
export function ReturnToToolsButton() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  return (
    <Link
      href="/"
      aria-label="Back to toolbase — All Tools"
      className="group inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl
                 border border-(--border-medium)
                 bg-(--surface-overlay) backdrop-blur-md
                 shadow-sm shadow-black/[0.05] dark:shadow-black/20
                 transition-all duration-200 ease-out
                 hover:shadow-md hover:shadow-black/[0.08] dark:hover:shadow-black/30
                 hover:border-(--border-subtle) hover:bg-(--surface-hover)
                 active:scale-95 active:shadow-none"
    >
      {/* Icon chip */}
      <span
        className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0
                   bg-(--surface-active) border border-(--border-subtle)
                   text-(--text-muted)
                   transition-all duration-200
                   group-hover:bg-blue-500/10 group-hover:border-blue-500/20 group-hover:text-blue-500"
      >
        <LayoutGrid className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
      </span>

      {/* Label */}
      <span className="flex flex-col gap-px leading-none">
        <span className="text-[8.5px] font-black uppercase tracking-[0.16em] text-(--text-muted) group-hover:text-blue-500 transition-colors duration-200">
          toolbase
        </span>
        <span className="text-[12px] font-semibold tracking-tight text-(--text-primary)">
          All Tools
        </span>
      </span>

      {/* Keyboard shortcut badge */}
      <span className="ml-1 flex items-center gap-0.5">
        <kbd
          className="inline-flex items-center px-1 py-0.5 rounded-md text-[9px] font-bold
                     bg-(--kbd-bg) border border-(--border-medium)
                     text-(--text-muted) font-mono leading-none
                     group-hover:border-blue-500/20 group-hover:text-blue-500/70
                     transition-colors duration-200"
        >
          {isMac ? "⌘" : "Ctrl"}
        </kbd>
        <kbd
          className="inline-flex items-center px-1 py-0.5 rounded-md text-[9px] font-bold
                     bg-(--kbd-bg) border border-(--border-medium)
                     text-(--text-muted) font-mono leading-none
                     group-hover:border-blue-500/20 group-hover:text-blue-500/70
                     transition-colors duration-200"
        >
          K
        </kbd>
      </span>
    </Link>
  );
}
