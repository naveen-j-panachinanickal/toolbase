'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { m, AnimatePresence, useScroll, useMotionValueEvent, Variants } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ToolCardProps } from '@/types/tool-search';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { usePinnedTools } from '@/hooks/usePinnedTools';


interface BottomNavProps {
    tools: ToolCardProps[];
    className?: string;
    triggerId?: string;
}

export default function BottomNav({ tools, className, triggerId = "tool-grid-section" }: BottomNavProps) {
    const { scrollY } = useScroll();
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const { pinnedTools } = usePinnedTools();

    const checkVisibility = useCallback(() => {
        const toolGrid = document.getElementById(triggerId);
        if (!toolGrid) return;

        const rect = toolGrid.getBoundingClientRect();
        const isGridAboveViewport = rect.bottom <= 0;
        const isAtBottom = (window.scrollY + window.innerHeight) >= (document.body.scrollHeight - 20);

        const shouldShow = isGridAboveViewport && !isAtBottom;
        setIsVisible(shouldShow);
    }, [triggerId]);

    useEffect(() => {
        checkVisibility();
        const toolGrid = document.getElementById(triggerId);
        if (!toolGrid) return;

        const resizeObserver = new ResizeObserver(() => checkVisibility());
        resizeObserver.observe(toolGrid);
        resizeObserver.observe(document.body);

        window.addEventListener('resize', checkVisibility);
        window.addEventListener('scroll', checkVisibility);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', checkVisibility);
            window.removeEventListener('scroll', checkVisibility);
        };
    }, [triggerId, checkVisibility]);

    useMotionValueEvent(scrollY, "change", () => checkVisibility());

    // Focus input when opened
    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isSearchOpen) {
            setSearchQuery(''); // Clear search when closed
        }
    }, [isSearchOpen]);

    const variants: Variants = {
        hidden: {
            y: 60, // Start slightly below
            scale: 0.95, // Scale down
            opacity: 0,
            filter: "blur(0px)", // Blur transition start
            boxShadow: "0px 0px 0px rgba(0,0,0,0)",
        },
        visible: {
            y: 0,
            scale: 1,
            opacity: 1,
            filter: "blur(0px)", // Ensure no blur on element itself if using backdrop-blur
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 1,
                filter: { duration: 0.3 },
                boxShadow: { duration: 0.3 }
            }
        },
        exit: {
            y: 60,
            scale: 0.95,
            opacity: 0,
            filter: "blur(0px)",
            boxShadow: "0px 0px 0px rgba(0,0,0,0)",
            transition: {
                duration: 0.2, // Slightly faster
                ease: "easeInOut"
            }
        }
    };

    // Sort and filter tools
    const sortedTools = [...tools].sort((a, b) => {
        const aPinned = pinnedTools.includes(a.toolFolderName || '');
        const bPinned = pinnedTools.includes(b.toolFolderName || '');
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
    });

    const filteredTools = sortedTools.filter(tool =>
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.metadata?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );


    return (
        <AnimatePresence>
            {isVisible && (
                <m.div
                    variants={variants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={cn(
                        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
                        "px-4 py-3 rounded-2xl",
                        "bg-black/10 backdrop-blur-sm border border-white/30",
                        "flex items-center gap-2",
                        "will-change-transform origin-center", // GPU hint
                        "max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-hide",
                        className
                    )}
                >
                    {/* Search Trigger / Input */}
                    <div className="flex items-center">
                        <AnimatePresence mode="wait">
                            {!isSearchOpen ? (
                                <m.button
                                    key="search-icon"
                                    layout
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsSearchOpen(true)}
                                    className="p-2 rounded-xl hover:bg-black/20 cursor-pointer transition-colors text-black/80"
                                >
                                    <Search size={20} />
                                </m.button>
                            ) : (
                                <m.div
                                    key="search-input"
                                    layout
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 200, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="flex items-center bg-black/10 rounded-xl px-2 h-10 overflow-hidden"
                                >
                                    <Search size={16} className="text-black/60 min-w-[16px] mr-2" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search tools..."
                                        className="bg-transparent border-none outline-none text-black text-sm w-full placeholder:text-black/40"
                                        onBlur={() => {
                                            if (!searchQuery) setIsSearchOpen(false);
                                        }}
                                    />
                                    <button
                                        onClick={() => setIsSearchOpen(false)}
                                        className="p-1 hover:bg-white/20 rounded-full ml-1"
                                    >
                                        <X size={14} className="text-black/60" />
                                    </button>
                                </m.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Separator */}
                    <div className="w-[1px] h-6 bg-black/20 mx-1" />

                    {/* Tools List */}
                    <AnimatePresence mode="popLayout">
                        {filteredTools.map((tool) => {
                            const isActive = pathname === `/tools/${tool.toolFolderName}`;
                            return (
                                <m.div
                                    key={tool.title}
                                    layout
                                    initial={{ scale: 0, opacity: 0, width: 0 }}
                                    animate={{ scale: 1, opacity: 1, width: "auto" }}
                                    exit={{ scale: 0, opacity: 0, width: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                >
                                    <Link
                                        href={tool.route}
                                        title={tool.title}
                                        className="relative group p-2 rounded-xl transition-colors block"
                                    >
                                        <m.div
                                            className="relative w-10 h-10 origin-bottom"
                                            whileHover={{ scale: 1.25, transition: { type: "spring", stiffness: 400, damping: 15 } }}
                                            whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
                                        >
                                            <Image
                                                src={tool.icon}
                                                alt={tool.title}
                                                fill
                                                className="object-contain drop-shadow-sm rounded-[14px]"
                                            />
                                        </m.div>
                                        {isActive && (
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-black/50" />
                                        )}

                                        {/* Tooltip */}
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-sm shadow-lg transform translate-y-2 group-hover:translate-y-0 duration-200 z-50">
                                            {tool.title}
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
                                        </div>
                                    </Link>
                                </m.div>
                            );
                        })}
                    </AnimatePresence>

                    {filteredTools.length === 0 && (
                        <div className="px-2 text-white/50 text-sm italic">
                            No tools found
                        </div>
                    )}
                </m.div>
            )}
        </AnimatePresence>
    );
}
