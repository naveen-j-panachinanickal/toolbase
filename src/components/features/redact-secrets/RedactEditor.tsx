import React, { useRef, useState } from "react";
import { FileText, Upload, X, Vault, Save } from "lucide-react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { ContentType } from "@/types/redact";
import { useNoteVault } from "@/hooks/useNoteVault";
import { VaultSelectorModal } from "./VaultSelectorModal";

interface RedactEditorProps {
    content: string;
    setContent: (val: string) => void;
    contentType: ContentType;
    setContentType: (type: ContentType) => void;
    fileName: string | null;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    saveToNoteVault: (title: string, data: string, addNote: any) => Promise<void>;
}

export const RedactEditor: React.FC<RedactEditorProps> = ({
    content,
    setContent,
    contentType,
    setContentType,
    fileName,
    onFileUpload,
    saveToNoteVault
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addNote } = useNoteVault();
    const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveToVault = async () => {
        if (!content.trim()) return;
        setIsSaving(true);
        try {
            await saveToNoteVault(`Redactor Content - ${fileName || "Text"} - ${new Date().toLocaleDateString()}`, content, addNote);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImportFromVault = (note: any) => {
        setContent(note.content);
        setContentType("text");
    };

    return (
        <>
            <div className="flex flex-col rounded-2xl border border-(--border-medium) bg-(--surface-overlay) backdrop-blur-xl overflow-hidden shadow-sm dark:shadow-black/20">
                {/* Header / Tabs */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-(--border-subtle) bg-(--surface-secondary)/30">
                    <div className="flex p-1 rounded-xl bg-(--surface-active) border border-(--border-subtle) relative">
                        {[
                            { id: "text", label: "Text Content", icon: FileText },
                            { id: "file", label: "File Upload", icon: Upload },
                        ].map((tab) => {
                            const isActive = contentType === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setContentType(tab.id as ContentType)}
                                    className={cn(
                                        "relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 z-10",
                                        isActive ? "text-(--text-primary)" : "text-(--text-muted) hover:text-(--text-secondary)"
                                    )}
                                >
                                    {isActive && (
                                        <m.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-(--background) border border-(--border-subtle) rounded-lg shadow-sm"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                        />
                                    )}
                                    <tab.icon className="w-3.5 h-3.5 relative z-10" />
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {content && (
                            <button
                                onClick={handleSaveToVault}
                                disabled={isSaving}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-(--text-primary) hover:bg-black/5 dark:hover:bg-white/5 transition-all border border-(--border-subtle)"
                                title="Save current content to Note Vault"
                            >
                                <Save className="w-3 h-3 opacity-60" />
                                {isSaving ? "Saving..." : "Save to Vault"}
                            </button>
                        )}
                        <button
                            onClick={() => setIsVaultModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-(--text-primary) hover:bg-black/5 dark:hover:bg-white/5 transition-all border border-(--border-subtle)"
                            title="Import content from Note Vault"
                        >
                            <Vault className="w-3 h-3 opacity-60" />
                            Import Vault
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="relative">
                    {contentType === "text" ? (
                        <textarea
                            placeholder="Paste your logs, code, or sensitive text here..."
                            className="w-full min-h-[350px] p-6 bg-transparent text-sm font-mono leading-relaxed outline-none resize-none placeholder:text-(--text-muted)/50"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    ) : (
                        <div className="min-h-[350px] flex flex-col items-center justify-center p-8">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "w-full max-w-md border-2 border-dashed rounded-3xl p-10 transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center text-center",
                                    fileName 
                                        ? "border-emerald-500/30 bg-emerald-500/5" 
                                        : "border-(--border-medium) hover:border-violet-500/50 hover:bg-violet-500/5"
                                )}
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-sm",
                                    fileName ? "bg-emerald-500/20 text-emerald-500" : "bg-(--surface-active) text-(--text-muted)"
                                )}>
                                    <Upload className="w-8 h-8" />
                                </div>
                                
                                {fileName ? (
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-(--text-primary)">{fileName}</h3>
                                        <p className="text-xs text-emerald-500/80 font-medium">Ready for redaction</p>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onFileUpload({ target: { files: null } } as any);
                                            }}
                                            className="mt-4 text-[10px] uppercase tracking-wider font-bold text-(--text-muted) hover:text-red-500 flex items-center gap-1 mx-auto"
                                        >
                                            <X className="w-3 h-3" /> Remove File
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-(--text-primary)">Click or drag to upload</h3>
                                        <p className="text-xs text-(--text-muted)">Supports .txt, .log, .json, .csv, and more</p>
                                    </div>
                                )}
                            </div>
                            
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={(e) => {
                                    onFileUpload(e);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                accept=".txt,.log,.json,.csv,.py,.js,.ts,.tsx,.html,.css,.md"
                            />
                        </div>
                    )}

                    {/* Character count / Status */}
                    {content && (
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 px-2 py-1 rounded-md bg-(--background)/50 backdrop-blur-sm border border-(--border-subtle) text-[10px] font-mono text-(--text-muted)">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {content.length.toLocaleString()} chars
                        </div>
                    )}
                </div>
            </div>

            <VaultSelectorModal
                isOpen={isVaultModalOpen}
                onClose={() => setIsVaultModalOpen(false)}
                onSelect={handleImportFromVault}
                title="Select Content Note"
            />
        </>
    );
};
