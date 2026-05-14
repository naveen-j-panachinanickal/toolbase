import React, { useState } from "react";
import { Settings2, Key, Type, Hash, Code, Upload, Database, Save, FolderOpen } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TagInput } from "@/components/ui/TagInput";
import { MaskingStyle } from "@/types/redact";
import { useNoteVault } from "@/hooks/useNoteVault";
import { VaultSelectorModal } from "./VaultSelectorModal";

interface RedactConfigurationProps {
    maskingStyle: MaskingStyle;
    setMaskingStyle: (style: MaskingStyle) => void;
    keys: string[];
    setKeys: (keys: string[]) => void;
    literalTexts: string[];
    setLiteralTexts: (texts: string[]) => void;
    regexPatterns: string[];
    setRegexPatterns: (patterns: string[]) => void;
    onRulesUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    saveToNoteVault: (title: string, data: string, addNote: any) => Promise<void>;
}

export const RedactConfiguration: React.FC<RedactConfigurationProps> = ({
    maskingStyle,
    setMaskingStyle,
    keys,
    setKeys,
    literalTexts,
    setLiteralTexts,
    regexPatterns,
    setRegexPatterns,
    onRulesUpload,
    saveToNoteVault,
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { addNote } = useNoteVault();
    const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveToVault = async () => {
        if (literalTexts.length === 0 && keys.length === 0 && regexPatterns.length === 0) return;
        
        setIsSaving(true);
        try {
            // Combine all rules into a comma-separated string for simplicity
            const allRules = [...literalTexts, ...keys, ...regexPatterns].join(", ");
            await saveToNoteVault(`Redactor Rules - ${new Date().toLocaleDateString()}`, allRules, addNote);
            // Could add a toast here
        } finally {
            setIsSaving(false);
        }
    };

    const handleImportFromVault = (note: any) => {
        const content = note.content;
        const items = content
            .split(/[,\n\r]+/)
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);
        
        const next = [...literalTexts];
        items.forEach((item: string) => {
            if (!next.includes(item)) next.push(item);
        });
        setLiteralTexts(next);
    };

    return (
        <>
            <div className="flex flex-col rounded-2xl border border-(--border-medium) bg-(--surface-overlay) backdrop-blur-xl overflow-hidden shadow-sm dark:shadow-black/20">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-(--border-subtle) bg-(--surface-secondary)/30">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-(--text-muted)" />
                        <span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">Configuration</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={onRulesUpload}
                            className="hidden"
                            accept=".txt,.csv,.json"
                        />
                        
                        <div className="flex items-center bg-(--surface-active) rounded-lg p-0.5 border border-(--border-subtle)">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/10 transition-all"
                                title="Import from File (.txt)"
                            >
                                <Upload className="w-3 h-3" />
                                File
                            </button>
                            <div className="w-px h-3 bg-(--border-subtle) mx-0.5" />
                            <button
                                onClick={() => setIsVaultModalOpen(true)}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-(--text-primary) hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                title="Import from Note Vault"
                            >
                                <Database className="w-3 h-3 opacity-60" />
                                Vault
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-6">
                    {/* Redaction Style */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.12em] text-(--text-muted)">
                            Redaction Style
                        </label>
                        <div className="flex p-1 rounded-xl bg-(--surface-active) border border-(--border-subtle) relative">
                            {[
                                { id: "partial", label: "Partial", icon: Hash },
                                { id: "full", label: "Full", icon: Type },
                                { id: "hash", label: "Hash", icon: Code },
                            ].map((style) => {
                                const isActive = maskingStyle === style.id;
                                return (
                                    <button
                                        key={style.id}
                                        onClick={() => setMaskingStyle(style.id as MaskingStyle)}
                                        className={cn(
                                            "relative flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors duration-200 z-10",
                                            isActive ? "text-(--text-primary)" : "text-(--text-muted) hover:text-(--text-secondary)"
                                        )}
                                    >
                                        {isActive && (
                                            <m.div
                                                layoutId="activeConfigTab"
                                                className="absolute inset-0 bg-(--background) border border-(--border-subtle) rounded-lg shadow-sm"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                            />
                                        )}
                                        <style.icon className="w-3.5 h-3.5 relative z-10" />
                                        <span className="relative z-10">{style.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Advanced Rules */}
                    <div className="space-y-5 pt-5 border-t border-(--border-subtle)">
                        <div className="space-y-4">
                            <TagInput
                                label={
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-(--text-muted) mb-1.5">
                                        <Key className="w-3 h-3 text-blue-500" /> Force Mask Keys
                                    </div>
                                }
                                placeholder="e.g. api_key"
                                values={keys}
                                onChange={setKeys}
                                onClear={() => setKeys([])}
                                color="blue"
                            />
                            <TagInput
                                label={
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-(--text-muted) mb-1.5">
                                        <Type className="w-3 h-3 text-purple-500" /> Specific Content
                                    </div>
                                }
                                placeholder="e.g. MyPassword123"
                                values={literalTexts}
                                onChange={setLiteralTexts}
                                onClear={() => setLiteralTexts([])}
                                color="purple"
                            />
                            <TagInput
                                label={
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-(--text-muted) mb-1.5">
                                        <Code className="w-3 h-3 text-emerald-500" /> Custom Regex
                                    </div>
                                }
                                placeholder="e.g. \b[A-Z0-9._%+-]+@..."
                                values={regexPatterns}
                                onChange={setRegexPatterns}
                                onClear={() => setRegexPatterns([])}
                                color="emerald"
                            />
                        </div>

                        {/* Save to Vault Action */}
                        <div className="pt-4">
                            <button
                                onClick={handleSaveToVault}
                                disabled={isSaving || (literalTexts.length === 0 && keys.length === 0 && regexPatterns.length === 0)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-(--border-medium) bg-(--surface-active) text-xs font-bold text-(--text-primary) hover:bg-(--surface-active-hover) transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                            >
                                <Save className="w-3.5 h-3.5 opacity-60" />
                                {isSaving ? "Saving..." : "Save Rules to Vault"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <VaultSelectorModal
                isOpen={isVaultModalOpen}
                onClose={() => setIsVaultModalOpen(false)}
                onSelect={handleImportFromVault}
                title="Select Rules Note"
            />
        </>
    );
};
