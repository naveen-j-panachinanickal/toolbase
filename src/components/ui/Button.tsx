import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
        const variants = {
            primary: "macos-primary-button",
            secondary: "macos-button",
            ghost: "bg-transparent text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-hover) active:scale-[0.97]",
            outline: "bg-transparent border border-(--border-medium) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-hover) hover:shadow-sm active:scale-[0.97]",
            danger: "bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-[0.97] border border-red-600 shadow-red-500/20",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-5 text-sm",
            lg: "h-12 px-8 text-base font-semibold",
            icon: "h-9 w-9 p-0",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex cursor-pointer items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                <span className="relative flex items-center gap-2">
                    {children}
                </span>
            </button>
        );
    }
);

Button.displayName = "Button";
