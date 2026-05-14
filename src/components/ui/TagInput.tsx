"use client";

import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TagInputProps {
    label: React.ReactNode;
    values: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    color?: string;
    onClear?: () => void;
}

import { Label } from "@/components/ui/Label";

export const TagInput: React.FC<TagInputProps> = ({
    label,
    values,
    onChange,
    placeholder = "Add...",
    color = "blue",
    onClear,
}) => {
    const [inputValue, setInputValue] = useState("");

    const handleAdd = () => {
        if (inputValue.trim() && !values.includes(inputValue.trim())) {
            onChange([...values, inputValue.trim()]);
            setInputValue("");
        }
    };

    const handleRemove = (index: number) => {
        onChange(values.filter((_, i) => i !== index));
    };

    const colorClasses: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 border-blue-100/50",
        purple: "bg-purple-50 text-purple-600 border-purple-100/50",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100/50",
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>{label}</Label>
                {onClear && values.length > 0 && (
                    <button
                        onClick={onClear}
                        className="text-[10px] font-bold text-(--text-muted) hover:text-red-500 transition-colors uppercase tracking-wider haptic-click"
                    >
                        Clear
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-2 p-2.5 glass-input min-h-[52px] max-h-[160px] overflow-y-auto scrollbar-thin">
                <AnimatePresence mode="popLayout">
                    {values.map((v, i) => (
                        <m.span
                            key={v}
                            initial={{ opacity: 0, scale: 0.8, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold border rounded-lg",
                                colorClasses[color] || colorClasses.blue
                            )}
                        >
                            {v}
                            <button
                                onClick={() => handleRemove(i)}
                                className="hover:bg-black/10 rounded-full p-0.5 transition-colors haptic-click"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </m.span>
                    ))}
                </AnimatePresence>
                <div className="flex-1 min-w-[120px] flex items-center">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAdd();
                            }
                        }}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-medium p-0 ml-1 text-gray-700 placeholder:text-gray-300"
                    />
                    {inputValue && (
                        <button
                            onClick={handleAdd}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all haptic-click"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

