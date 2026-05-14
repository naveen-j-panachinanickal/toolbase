import React, { useState, useEffect, useRef } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { LazyEditor as Editor } from "@/components/ui/LazyEditor";
import { Note } from '@/types/note-vault';
import { useNoteWorker } from '@/hooks/useNoteWorker';

interface NoteEditorProps {
  note: Note;
  onChange: (content: string) => void;
}

const formatToLanguage = (format: string, customLang?: string) => {
  if (format === 'code' && customLang) return customLang;
  const map: Record<string, string> = {
    'text': 'plaintext',
    'markdown': 'markdown',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'html': 'html',
    'sql': 'sql',
    'css': 'css',
    'diff': 'diff',
    'env': 'shell', // simple highlighting
    'regex': 'regex',
    'csv': 'plaintext',
  };
  return map[format] || 'plaintext';
};

export default function NoteEditor({ note, onChange }: NoteEditorProps) {
  const [content, setContent] = useState(note.content);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const { runTask } = useNoteWorker();
  
  // Sync prop changes
  useEffect(() => {
    setContent(note.content);
  }, [note.id]); // Note: only sync on ID change to avoid cursor jump issues during typing, local state drives the editor

  const handleChange = (val: string | undefined) => {
    const newVal = val || '';
    setContent(newVal);
    onChange(newVal);
  };

  useEffect(() => {
    let active = true;
    if (note.format === 'markdown') {
       runTask('MARKDOWN_TO_HTML', content).then(html => {
           if (active) setPreviewHtml(html);
       }).catch(() => {});
    } else {
        setPreviewHtml(null);
    }
    return () => { active = false; };
  }, [content, note.format, runTask]);

  return (
    <div className="flex h-full w-full">
        <div className="flex-1 h-full relative">
            <Editor
                height="100%"
                language={formatToLanguage(note.format, note.language)}
                value={content}
                theme="vs-dark"
                onChange={handleChange}
                options={{
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                }}
            />
        </div>
        
        {/* Markdown Preview Pane */}
        {note.format === 'markdown' && (
            <div className="flex-1 h-full border-l border-(--border-subtle) bg-(--background) p-6 overflow-y-auto prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: previewHtml || '' }} />
            </div>
        )}
    </div>
  );
}
