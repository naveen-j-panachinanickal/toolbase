"use client";

import React, { useState, useMemo } from 'react';
import ToolCard from './ToolCard';
import { m, AnimatePresence, Variants } from 'framer-motion';
import { ToolCardProps } from '@/types/tool-search';
import { searchTools } from '@/lib/searchTools';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolGridProps {
    searchQuery: string;
    tools: ToolCardProps[];
}

const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: i * 0.04
        }
    })
};

const ToolGrid: React.FC<ToolGridProps> = ({ searchQuery, tools }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const filteredTools = useMemo(() => {
        return searchTools(tools, searchQuery);
    }, [searchQuery, tools]);

    // Show only first 12 tools by default (2 rows of 6 on desktop)
    const displayTools = isExpanded || searchQuery ? filteredTools : filteredTools.slice(0, 12);

    return (
        <div className="flex flex-col items-center mt-12 w-full">
            <m.div
                layout
                className="grid w-full sm:px-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12 pb-8 overflow-hidden"
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {displayTools.map((tool, index) => (
                        <m.div
                            key={tool.title}
                            variants={itemVariants}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            layout
                        >
                            <ToolCard
                                title={tool.title}
                                route={tool.route}
                                icon={tool.icon}
                                metadata={tool.metadata}
                                toolId={tool.toolId}
                                priority={index < 6}
                            />
                        </m.div>
                    ))}
                </AnimatePresence>
            </m.div>

            {!searchQuery && filteredTools.length > 12 && (
                <div className="flex justify-center mt-12">
                    <m.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={cn(
                            "group flex items-center gap-2.5 px-8 py-3 rounded-full cursor-pointer transition-all duration-300",
                            "backdrop-blur-md border shadow-lg hover:shadow-xl",
                        )}
                        style={{
                            background: 'var(--surface-secondary)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)',
                        }}
                    >
                        <span className="text-sm font-semibold tracking-wide">
                            {isExpanded ? 'Show less' : `Show all tools (${filteredTools.length})`}
                        </span>
                        <m.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        >
                            <ChevronDown size={18} className="text-primary group-hover:text-primary/80 transition-colors" />
                        </m.div>
                    </m.button>
                </div>
            )}

            {filteredTools.length === 0 && (
                <p className="mt-8 text-lg font-medium opacity-60" style={{ color: 'var(--text-secondary)' }}>
                    No tools found for &quot;{searchQuery}&quot;
                </p>
            )}
        </div>
    );
};

export default ToolGrid;
