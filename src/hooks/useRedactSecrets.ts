import { useState, useCallback, useEffect } from "react";
import { useRedactWorker } from "@/hooks/useRedactWorker";
import { RedactRequest, RedactResponse, ContentType, MaskingStyle } from "@/types/redact";
import { Note } from "@/types/note-vault";

const STORAGE_KEY = "toolbase:redact-settings";

interface PersistedSettings {
    maskingStyle: MaskingStyle;
    keys: string[];
    literalTexts: string[];
    regexPatterns: string[];
}

export function useRedactSecrets(initial?: {
    content?: string;
    contentType?: ContentType;
    fileName?: string | null;
    maskingStyle?: MaskingStyle;
    keys?: string[];
    literalTexts?: string[];
    regexPatterns?: string[];
}) {
    // Input State
    const [content, setContent] = useState(initial?.content ?? "");
    const [contentType, setContentType] = useState<ContentType>(initial?.contentType ?? "text");
    const [fileName, setFileName] = useState<string | null>(initial?.fileName ?? null);

    // Configuration State
    const [maskingStyle, setMaskingStyle] = useState<MaskingStyle>(initial?.maskingStyle ?? "partial");
    const [keys, setKeys] = useState<string[]>(initial?.keys ?? []);
    const [literalTexts, setLiteralTexts] = useState<string[]>(initial?.literalTexts ?? []);
    const [regexPatterns, setRegexPatterns] = useState<string[]>(initial?.regexPatterns ?? []);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const settings: PersistedSettings = JSON.parse(saved);
                if (settings.maskingStyle) setMaskingStyle(settings.maskingStyle);
                if (settings.keys) setKeys(settings.keys);
                if (settings.literalTexts) setLiteralTexts(settings.literalTexts);
                if (settings.regexPatterns) setRegexPatterns(settings.regexPatterns);
            } catch (e) {
                console.error("Failed to load redacted settings", e);
            }
        }
    }, []);

    // Save to localStorage when settings change
    useEffect(() => {
        const settings: PersistedSettings = {
            maskingStyle,
            keys,
            literalTexts,
            regexPatterns,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [maskingStyle, keys, literalTexts, regexPatterns]);

    // Output State
    const [response, setResponse] = useState<RedactResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isInternalLoading, setIsInternalLoading] = useState(false);

    // Worker
    const { redact, isLoading: isWasmLoading, isReady, engineLabel } = useRedactWorker();

    const isLoading = isInternalLoading || isWasmLoading;

    // Actions
    const handleRedact = useCallback(async () => {
        if (!content.trim()) return;

        setIsInternalLoading(true);
        setError(null);

        const requestBody: RedactRequest = {
            content,
            contentType,
            customConfigurations: {
                style: maskingStyle,
                userHints: {
                    keys,
                    literalTexts,
                    regexPatterns,
                }
            },
        };

        try {
            const data = await redact(requestBody);
            setResponse(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong during local processing.";
            setError(message);
            console.error(err);
        } finally {
            setIsInternalLoading(false);
        }
    }, [content, contentType, maskingStyle, keys, literalTexts, regexPatterns, redact]);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === "string") {
                setContent(result);
            }
        };

        reader.onerror = () => {
            setError("Failed to read file");
        };

        reader.readAsText(file);
        
        // Reset input value
        e.target.value = "";
    }, []);

    const handleRulesUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === "string") {
                // Split by comma OR newline, then trim and filter empty
                const items = result
                    .split(/[,\n\r]+/)
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
                
                // Merge with existing literalTexts, avoiding duplicates
                setLiteralTexts(prev => {
                    const next = [...prev];
                    items.forEach(item => {
                        if (!next.includes(item)) {
                            next.push(item);
                        }
                    });
                    return next;
                });
            }
        };

        reader.onerror = () => {
            setError("Failed to read rules file");
        };

        reader.readAsText(file);
        
        // Reset input value to allow re-uploading the same file
        e.target.value = "";
    }, []);

    const clearAll = useCallback(() => {
        setContent("");
        setResponse(null);
        setError(null);
        setFileName(null);
        setKeys([]);
        setLiteralTexts([]);
        setRegexPatterns([]);
    }, []);

    return {
        // State
        content, setContent,
        contentType, setContentType,
        fileName, setFileName,
        maskingStyle, setMaskingStyle,
        keys, setKeys,
        literalTexts, setLiteralTexts,
        regexPatterns, setRegexPatterns,
        response, setResponse,
        error, setError,
        isLoading,
        isReady,
        engineLabel,

        // Actions
        handleRedact,
        handleFileUpload,
        handleRulesUpload,
        saveToNoteVault: async (title: string, data: string, addNote: (note: Note) => Promise<void>) => {
            const newNote: Note = {
                id: crypto.randomUUID(),
                title: title || "Redactor Rules",
                content: data,
                format: "text",
                collectionId: "default",
                isPinned: false,
                tags: ["redactor", "rules"],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                revisions: []
            };
            await addNote(newNote);
        },
        clearAll
    };
}
