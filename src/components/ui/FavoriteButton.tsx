'use client';

/**
 * FavoriteButton
 *
 * A heart-icon toggle that marks a tool as a favourite.
 * Visibility is controlled by the parent via className (e.g. opacity-0 group-hover:opacity-100).
 * The parent ToolCard wraps this and passes visibility classes — this keeps the button
 * decoupled from any specific hover context.
 */

import React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToolPreferences } from '@/hooks/useToolPreferences';

interface FavoriteButtonProps {
    toolId: string;
    className?: string;
}

export function FavoriteButton({ toolId, className }: FavoriteButtonProps) {
    const { isFavorite, toggleFavorite } = useToolPreferences();
    const favorited = isFavorite(toolId);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(toolId);
    };

    return (
        <button
            id={`favorite-btn-${toolId}`}
            onClick={handleClick}
            aria-label={favorited ? `Remove ${toolId} from favourites` : `Add ${toolId} to favourites`}
            aria-pressed={favorited}
            title={favorited ? 'Remove from favourites' : 'Add to favourites'}
            className={cn(
                'flex items-center justify-center',
                'w-7 h-7 rounded-full',
                'transition-all duration-200 ease-in-out',
                'shadow-sm',
                favorited
                    ? 'bg-red-50 hover:bg-red-100'
                    : 'bg-white/70 backdrop-blur-sm hover:bg-red-50',
                className
            )}
        >
            <Heart
                size={13}
                className={cn(
                    'transition-all duration-200',
                    favorited
                        ? 'fill-red-500 text-red-500'
                        : 'text-black/40 hover:text-red-400'
                )}
            />
        </button>
    );
}
