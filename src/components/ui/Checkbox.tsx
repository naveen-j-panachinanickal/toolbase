import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, ...props }, ref) => {
        return (
            <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                    <input
                        type="checkbox"
                        ref={ref}
                        className="peer sr-only"
                        {...props}
                    />
                    <div
                        className={cn(
                            "w-5 h-5 border-2 border-gray-300 rounded-md bg-white transition-all duration-200 flex items-center justify-center",
                            "peer-checked:bg-primary peer-checked:border-primary peer-checked:[&>svg]:opacity-100 peer-focus:ring-2 peer-focus:ring-primary/20",
                            "group-hover:border-primary/50",
                            className
                        )}
                    >
                        <Check className="w-3.5 h-3.5 text-white opacity-0 transition-opacity duration-200" />
                    </div>
                </div>
                {label && (
                    <span className="text-sm font-medium text-gray-700 select-none group-hover:text-gray-900 transition-colors">
                        {label}
                    </span>
                )}
            </label>
        );
    }
);

Checkbox.displayName = "Checkbox";
