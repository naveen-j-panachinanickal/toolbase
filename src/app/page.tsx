'use client';

import NextImage from 'next/image';
import SearchBar from "../components/ui/SearchBar";
import ToolGrid from "../components/ui/ToolGrid";
import { useState, useMemo } from 'react';
import { m, Variants } from 'framer-motion';
import BottomNav from "../components/ui/BottomNav";
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { TOOLS } from '@/config/tools.registry';
import type { ToolMeta } from '@/types/tool-search';
import { ToolCardProps } from '@/types/tool-search';
import { RecentsDrawer } from '@/components/ui/RecentsDrawer';
import { FavoritesDrawer } from '@/components/ui/FavoritesDrawer';

import { TryPipelineButton } from '@/components/ui/TryPipelineButton';

/**
 * Map the central tool registry to the ToolCardProps shape expected
 * by ToolGrid / ToolCard. This is the single translation point —
 * add a tool to tools.registry.ts and it automatically appears here.
 */
function registryToCardProps(tools: ToolMeta[]): ToolCardProps[] {
  return tools
    .filter((tool) => tool.route !== 'pipeline') // Remove pipeline from grid
    .map((tool) => ({
      title: tool.name,
      route: tool.route,
      icon: tool.thumbnail,
      metadata: tool.tags,
      toolId: tool.id,
    }));
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecentsOpen, setIsRecentsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  const tools = useMemo(() => registryToCardProps(TOOLS), []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.2,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  return (
    <div>
      <Header
        onOpenRecents={() => setIsRecentsOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
      />
      <div className="view relative font-display min-h-screen flex flex-col selection:bg-primary/30 antialiased overflow-x-hidden"
        style={{ color: 'var(--text-primary)' }}
      >

        <main className="relative grow z-10 px-4 md:px-20 lg:px-40 py-10 lg:py-24">
          <div className="max-w-[1200px] mx-auto">

            {/* Animated High-Impact Headline */}
            <m.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mb-16 md:mb-24"
            >
              <m.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold tracking-tight text-center leading-[1] md:leading-[0.9]"
              >
                <span className="block text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-500 to-cyan-400 pb-2 drop-shadow-sm">
                  Your tools.
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-br from-primary/80 via-blue-600 to-indigo-500 pb-4">
                  Your browser.
                </span>
              </m.h1>

              <m.p
                variants={itemVariants}
                className="text-center text-lg md:text-2xl lg:text-3xl font-medium opacity-80 max-w-2xl mx-auto mt-4 md:mt-6"
                style={{ color: 'var(--text-secondary)' }}
              >
                No servers, no tracking, no compromise.
              </m.p>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="mb-16 flex flex-col md:flex-row items-center justify-center gap-4"
            >
              <div className="w-full max-w-[500px]">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <div className="w-full max-w-[500px] md:w-auto">
                <TryPipelineButton />
              </div>
            </m.div>

            <div id="tool-grid-section">
              <ToolGrid searchQuery={searchQuery} tools={tools} />
            </div>

            <div className="mt-20 flex justify-center">
              <div
                className="
                          flex items-center gap-2
                          px-5 py-2.5
                          rounded-full
                          backdrop-blur-xl
                          border
                          transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
                }}
              >
                <span className="text-sm">
                  Open source with
                </span>

                <span className="text-red-500 text-sm">❤️</span>

                <span className="text-sm">
                  by the Open Build Network.
                </span>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <BottomNav tools={tools} />
      </div>

      <RecentsDrawer
        isOpen={isRecentsOpen}
        onClose={() => setIsRecentsOpen(false)}
      />
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
      />
    </div>
  );
}
