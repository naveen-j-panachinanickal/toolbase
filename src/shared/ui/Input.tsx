import React from "react";
import { cn } from "@/shared/lib/utils";

/** Props for the Input component. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

/**
 * A themed text input component.
 * 
 * Implements a glassmorphic design consistent with the macOS aesthetic,
 * including focus states and placeholder styling.
 *
 * @param props - Component properties and standard HTML input attributes.
 * @param ref - Forwarded reference to the underlying HTMLInputElement.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "glass-input flex h-11 w-full px-4 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
        );

    }
);
Input.displayName = "Input";
