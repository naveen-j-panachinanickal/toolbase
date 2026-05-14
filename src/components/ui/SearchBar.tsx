import React, { useEffect, useState, useRef } from 'react';
import { Search, Command } from 'lucide-react';
import { cn } from "@/lib/utils";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isMac, setIsMac] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);

        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd+K / Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                return;
            }

            // Don't trigger if already in an input/textarea
            const activeElement = document.activeElement;
            const isInput = activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                (activeElement as HTMLElement)?.isContentEditable;

            if (isInput) return;

            // Trigger on printable characters (length 1 characters)
            // but ignore if any modifier keys are pressed (except Shift)
            if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className={cn(
            "relative sm:w-[500px] w-full group transition-all duration-500 ease-out mx-auto md:mx-0",
            isFocused ? "scale-[1.02] -translate-y-1" : "scale-100 translate-y-0"
        )}>
            {/* Search Icon */}
            <div
                className={cn(
                    "absolute left-5 top-1/2 -translate-y-1/2 z-10 transition-colors duration-300",
                )}
                style={{ color: isFocused ? 'var(--primary)' : 'var(--text-muted)' }}
            >
                <Search className="w-5 h-5" />
            </div>

            {/* Input Field */}
            <input
                ref={inputRef}
                className={cn(
                    "w-full h-[56px] pl-14 pr-16 text-lg font-medium outline-none transition-all duration-300",
                    "backdrop-blur-xl rounded-2xl shadow-xs",
                    "focus:ring-12 focus:ring-primary/10"
                )}
                style={{
                    background: isFocused ? 'var(--input-bg-focus)' : 'var(--input-bg)',
                    border: isFocused ? '1px solid var(--primary, #2b8cee)' : '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                }}
                placeholder="Search your favourite tools..."
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />

            {/* Shortcut Hint */}
            <div
                className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-md transition-opacity duration-300 pointer-events-none",
                    isFocused ? "opacity-0" : "opacity-100 sm:flex hidden"
                )}
                style={{
                    background: 'var(--kbd-bg)',
                    border: '1px solid var(--border-subtle)',
                }}
            >
                {isMac ? (
                    <>
                        <Command className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-[11px] font-bold font-mono" style={{ color: 'var(--text-muted)' }}>K</span>
                    </>
                ) : (
                    <>
                        <span className="text-[11px] font-bold font-mono" style={{ color: 'var(--text-muted)' }}>Ctrl</span>
                        <span className="text-[11px] font-bold font-mono" style={{ color: 'var(--text-muted)' }}>K</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
