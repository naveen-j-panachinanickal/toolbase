"use client";

import React, { useState } from "react";
import { Search, Vault, X } from "lucide-react";
import { m } from "framer-motion";
import { useNoteVault } from "@/hooks/useNoteVault";
import { Note } from "@/types/note-vault";
import { Button } from "@/components/ui/Button";

interface VaultSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (note: Note) => void;
    title?: string;
    filterFormat?: string;
}

export const VaultSelectorModal: React.FC<VaultSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    title = "Select Note from Vault",
    filterFormat
}) => {
    const { notes, isReady } = useNoteVault();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            note.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFormat = !filterFormat || note.format === filterFormat;
        return matchesSearch && matchesFormat;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <m.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <m.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-(--surface-elevated) rounded-3xl shadow-2xl border border-(--border-medium) overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-(--border-subtle) flex items-center justify-between bg-(--surface-secondary)/30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                            <Vault className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-(--text-primary)">{title}</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-(--text-muted)" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4 border-b border-(--border-subtle)">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            className="w-full pl-10 pr-4 py-2.5 bg-(--surface-active) border border-(--border-subtle) rounded-xl outline-none focus:border-violet-500/50 transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {!isReady ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <div className="w-12 h-12 bg-(--surface-secondary) rounded-2xl flex items-center justify-center mx-auto text-(--text-muted)">
                                <Search className="w-6 h-6 opacity-20" />
                            </div>
                            <p className="text-sm text-(--text-muted)">No notes found</p>
                        </div>
                    ) : (
                        filteredNotes.map((note) => (
                            <button
                                key={note.id}
                                onClick={() => {
                                    onSelect(note);
                                    onClose();
                                }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-violet-500/20 hover:bg-violet-500/5 transition-all group text-left"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-(--surface-secondary) flex items-center justify-center shrink-0 group-hover:bg-violet-500/10 group-hover:text-violet-500 transition-colors">
                                        <Vault className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm text-(--text-primary) truncate">{note.title}</h3>
                                        <p className="text-xs text-(--text-muted) truncate mt-0.5">{note.content.substring(0, 60)}...</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <span className="text-[10px] font-bold px-2 py-1 bg-(--surface-secondary) rounded-md text-(--text-muted) uppercase tracking-wider">
                                        {note.format}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-(--border-subtle) bg-(--surface-secondary)/20 flex items-center justify-between">
                    <p className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest">
                        {filteredNotes.length} Notes Available
                    </p>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 rounded-lg text-xs font-bold">
                        Cancel
                    </Button>
                </div>
            </m.div>
        </div>
    );
};
