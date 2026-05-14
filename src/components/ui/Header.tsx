'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { Search, Command, MessageSquare, Sparkles, Clock, Heart, Github, Info } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { InstallAppButton } from './InstallAppButton';
import { useAIChat } from '@/hooks/useAIChat';
import { useToolPreferences } from '@/hooks/useToolPreferences';

interface HeaderProps {
    onOpenPalette?: () => void;
    onOpenRecents?: () => void;
    onOpenFavorites?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenPalette, onOpenRecents, onOpenFavorites }) => {
    const { toggleChat } = useAIChat();
    const { recents, favorites } = useToolPreferences();

    return (
        <header
            className="sticky top-0 z-100 w-full px-2 sm:px-4 md:px-20 lg:px-40 py-3 sm:py-4 transition-all duration-300"
            style={{
                backdropFilter: 'blur(20px) saturate(200%)',
                WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                background: 'var(--glass-surface)',
                borderBottom: '1px solid var(--glass-border-color)',
                boxShadow: 'var(--glass-shadow)',
            }}
        >
            <div className="max-w-[1200px] p-1 sm:p-2 mx-auto flex items-center justify-between gap-1 sm:gap-4">
                <Link href="/" className="block shrink-0">
                    <div className="theme-logo-dark">
                        <div className='flex items-center gap-1.5 sm:gap-4'>
                            <Image className="h-4 sm:h-5 w-auto" src="/assets/images/logo-light.png" alt="Toolbase logo" width={479} height={183} priority />
                            <span className="w-px h-4 sm:h-5 bg-white/30 rounded-full" />
                            <Image className="h-4 sm:h-5 w-auto" src="/assets/images/logo-toolbase-light.png" alt="Toolbase logo" width={867} height={188} priority />
                        </div>
                    </div>
                    <div className="theme-logo-light">
                        <div className='flex items-center gap-1.5 sm:gap-4'>
                            <Image className="h-4 sm:h-5 w-auto" src="/assets/images/logo-dark.png" alt="Toolbase logo" width={372} height={136} priority />
                            <span className="w-px h-4 sm:h-5 bg-gray-400/65 rounded-full" />
                            <Image className="h-4 sm:h-5 w-auto" src="/assets/images/logo-toolbase-dark.png" alt="Toolbase logo" width={1390} height={355} priority />
                        </div>
                    </div>
                </Link>

                <div className="flex items-center gap-1 sm:gap-3">
                    {/* Cmd+K hint button */}
                    {onOpenPalette && (
                        <button
                            onClick={onOpenPalette}
                            aria-label="Open command palette"
                            title="Open command palette (Cmd+K)"
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-150 cursor-pointer"
                            style={{
                                background: 'var(--surface-hover)',
                                border: '1px solid var(--border-subtle)',
                            }}
                        >
                            <Search size={13} style={{ color: 'var(--text-muted)' }} />
                            <span className="text-[12px] font-medium" style={{ color: 'var(--text-faint)' }}>
                                Search tools…
                            </span>
                            <span className="flex items-center gap-0.5 ml-1">
                                <kbd
                                    className="flex items-center justify-center w-5 h-5 rounded text-[10px] font-medium"
                                    style={{ background: 'var(--kbd-bg)', color: 'var(--text-faint)' }}
                                >
                                    <Command size={9} />
                                </kbd>
                                <kbd
                                    className="flex items-center justify-center w-5 h-5 rounded text-[10px] font-medium"
                                    style={{ background: 'var(--kbd-bg)', color: 'var(--text-faint)' }}
                                >
                                    K
                                </kbd>
                            </span>
                        </button>
                    )}

                    {/* Mobile: icon-only search trigger */}
                    {onOpenPalette && (
                        <button
                            onClick={onOpenPalette}
                            aria-label="Search tools"
                            className="flex sm:hidden items-center justify-center w-9 h-9 rounded-xl transition-all duration-150"
                            style={{
                                background: 'var(--surface-hover)',
                                color: 'var(--text-muted)',
                            }}
                        >
                            <Search size={16} />
                        </button>
                    )}

                    {/* AI Chat Toggle */}
                    <button
                        onClick={toggleChat}
                        aria-label="Ask Echo?"
                        className="group relative flex items-center gap-1.5 sm:gap-2.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-md"
                        style={{
                            background: 'rgba(52, 87, 213, 0.1)',
                            border: '1px solid rgba(52, 87, 213, 0.4)',
                            boxShadow: 'none',
                        }}
                    >
                        <div className="h-6 w-6 sm:h-7 sm:w-7 overflow-hidden rounded-full border border-blue-500/30 bg-blue-500/10 p-0.5 transition-transform duration-300 group-hover:scale-110">
                            <Image src="/assets/images/echo_basic.png" alt="Echo" width={985} height={922} className="h-full w-full object-cover" priority />
                        </div>
                        <div className="hidden sm:block text-[13px] font-bold tracking-tight" style={{ color: '#3457D5' }}>
                            Ask Echo ?
                        </div>

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3457D5]/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        </div>
                    </button>


                    {/* Theme toggle */}
                    <ThemeToggle />
                    
                    {/* Favorites Toggle */}
                    <button
                        onClick={onOpenFavorites}
                        aria-label="Favorite tools"
                        className="group relative h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
                        style={{
                            background: 'var(--surface-hover)',
                            color: 'var(--text-muted)'
                        }}
                    >
                        <Heart size={18} className="group-hover:fill-red-500/20 group-hover:text-red-500 transition-all duration-200" />
                        
                        {favorites.length > 0 && (
                            <span 
                                className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-sm"
                            >
                                {favorites.length}
                            </span>
                        )}
                    </button>

                    {/* Recents Toggle */}
                    <button
                        onClick={onOpenRecents}
                        aria-label="Recently used tools"
                        className="group relative h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
                        style={{
                            background: 'var(--surface-hover)',
                            color: 'var(--text-muted)'
                        }}
                    >
                        <Clock size={18} className="group-hover:opacity-70 transition-opacity" />
                        
                        {recents.length > 0 && (
                            <span 
                                className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-sm"
                            >
                                {recents.length}
                            </span>
                        )}
                    </button>

                    {/* About Link */}
                    <Link
                        href="/about"
                        title="About toolbase"
                        className="group hidden sm:flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
                        style={{
                            background: 'var(--surface-hover)',
                            color: 'var(--text-muted)'
                        }}
                    >
                        <Info size={18} className="group-hover:text-primary transition-colors" />
                    </Link>

                    {/* GitHub Link */}
                    <a
                        href="https://github.com/openbuildnetwork/toolbase"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View on GitHub"
                        className="group hidden sm:flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150"
                        style={{
                            background: 'var(--surface-hover)',
                            color: 'var(--text-muted)'
                        }}
                    >
                        <Github size={18} className="group-hover:text-primary transition-colors" />
                    </a>

                    {/* PWA Install */}
                    <InstallAppButton />

                </div>
            </div>
        </header>
    );
};

export default Header;
