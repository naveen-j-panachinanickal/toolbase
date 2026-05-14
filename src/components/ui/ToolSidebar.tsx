'use client';

import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
    Search,
    Menu,
    Sidebar as SidebarIcon,
    LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolSidebarItem {
    id: string;
    label: string;
    icon: LucideIcon;
    disabled?: boolean;
    group?: string;
    badge?: string;
}

interface ToolSidebarProps {
    title: string;
    items: ToolSidebarItem[];
    activeId: string;
    onSelect: (id: string) => void;
    className?: string;

    // Controlled props
    isOpen: boolean;
    onToggle: (state: boolean) => void;

    version?: string;
}

export const ToolSidebar = ({
    title,
    items,
    activeId,
    onSelect,
    className,
    isOpen,
    onToggle,
    version = 'v1.0.0'
}: ToolSidebarProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onToggle(false)}
                        className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <m.aside
                initial={false}
                animate={{
                    width: isOpen ? 280 : 0,
                    x: isOpen ? 0 : 0 // On mobile we might want slide, but let's stick to width for now or conditional logic
                }}
                // Mobile override: Fixed position
                className={cn(
                    "fixed md:relative top-0 bottom-0 left-0 backdrop-blur-xl border-r flex flex-col z-40 h-full overflow-hidden shadow-2xl md:shadow-none transition-all duration-300 ease-in-out",
                    !isOpen && "border-none w-0", // w-0 for non-motion fallbacks
                    // Mobile specific positioning
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    "md:transform-none", // Reset transform on desktop where we use width animation
                    className
                )}
                style={{
                    background: 'var(--surface-overlay)',
                    borderColor: 'var(--border-medium)',
                }}
            >
                {/* 
                   Correction: Framer Motion animates inline styles. 
                   For mobile, we want it fixed full height. 
                   For desktop, relative full height.
                 */}

                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between shrink-0 min-w-[280px]" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="font-semibold text-[color:var(--text-primary)] text-sm tracking-tight flex items-center gap-2">
                        {title.toUpperCase()}
                    </span>
                    <button onClick={() => onToggle(false)} className="p-1 hover:bg-[var(--surface-active)] rounded-md transition-colors">
                        <SidebarIcon className="w-4 h-4 text-[color:var(--text-muted)]" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-3 shrink-0 min-w-[280px]">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[color:var(--text-faint)]" />
                        <input
                            type="text"
                            placeholder="Find action..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--surface-secondary)] border border-[color:var(--border-medium)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[color:var(--text-primary)] placeholder-[color:var(--text-faint)]"
                        />
                    </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto py-2 scrollbar-thin min-w-[280px]">
                    <div className="px-4 pb-2 text-xs font-semibold text-[color:var(--text-faint)] uppercase tracking-wider">
                        Quick Actions
                    </div>
                    {filteredItems.map((item) => (
                        <SidebarItem
                            key={item.id}
                            item={item}
                            isActive={activeId === item.id}
                            onClick={() => {
                                onSelect(item.id);
                                if (window.innerWidth < 768) onToggle(false);
                            }}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t shrink-0 min-w-[280px]" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="text-xs text-center text-[color:var(--text-faint)]">
                        {title} {version}
                    </div>
                </div>
            </m.aside>

            {/* Floating Toggle Button - only visible when closed */}
            <AnimatePresence>
                {!isOpen && (
                    <m.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-4 left-4 z-30"
                    >
                        <button
                            onClick={() => onToggle(true)}
                            className="rounded-full bg-[var(--surface-elevated)] border border-[color:var(--border-medium)] shadow-md p-2 hover:bg-[var(--surface-hover)] text-[color:var(--text-muted)] transition-transform active:scale-95"
                        >
                            <SidebarIcon className="w-4 h-4" />
                        </button>
                    </m.div>
                )}
            </AnimatePresence>
        </>
    );
};

const SidebarItem = ({
    item,
    isActive,
    onClick
}: {
    item: ToolSidebarItem;
    isActive: boolean;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        disabled={item.disabled}
        className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-l-2 cursor-pointer",
            isActive
                ? "bg-primary/10 border-primary text-primary"
                : "border-transparent text-[color:var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[color:var(--text-primary)]",
            item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[color:var(--text-secondary)]"
        )}
    >
        <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-[color:var(--text-muted)]")} />
        <span>{item.label}</span>
        {item.badge && (
            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500 rounded-full uppercase tracking-wider">
                {item.badge}
            </span>
        )}
    </button>
);
