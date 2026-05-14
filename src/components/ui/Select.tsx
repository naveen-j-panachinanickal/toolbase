import React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { }

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div className="relative group">
                <select
                    ref={ref}
                    className={cn(
                        "macos-button w-full appearance-none cursor-pointer pr-10 text-left font-medium",
                        "bg-linear-to-b from-(--surface-elevated) to-(--surface-secondary)",
                        "text-(--text-primary) border-(--border-medium)",
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-(--text-muted) group-hover:text-(--text-secondary) transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        );

    }
);
Select.displayName = "Select";
