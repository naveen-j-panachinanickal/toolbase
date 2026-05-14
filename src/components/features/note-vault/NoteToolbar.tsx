import React from 'react';
import { Note, NoteFormat } from '@/types/note-vault';

interface NoteToolbarProps {
  note: Note;
  onChange: (updates: Partial<Note>) => void;
  onDelete: () => void;
  onExport: () => void;
  onAutoDetect?: () => void;
}

const FORMATS: NoteFormat[] = [
  'text', 'markdown', 'code', 'json', 'xml',
  'yaml', 'csv', 'html', 'sql', 'env', 'diff', 'regex'
];

export default function NoteToolbar({ note, onChange, onDelete, onExport, onAutoDetect }: NoteToolbarProps) {
  return (
    <div className="h-14 border-b border-(--border-subtle) bg-(--surface-overlay)/30 flex items-center px-4 justify-between shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <input 
          type="text" 
          value={note.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="bg-transparent border-none outline-none text-lg font-semibold text-(--text-primary) flex-1 placeholder-(--text-faint) focus:ring-0"
          placeholder="Note title..."
        />
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {onAutoDetect && (
            <button
              onClick={onAutoDetect}
              className="text-(--text-muted) hover:text-indigo-400 p-1.5 rounded-md hover:bg-(--surface-hover) transition-colors"
              title="Auto-detect Format"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2.5l8 8"></path><path d="M14 2l1.5 4.5L20 8l-4.5 1.5L14 14l-1.5-4.5L8 8l4.5-1.5L14 2z"></path><path d="M14 14l1.5 4.5L20 20l-4.5 1.5L14 26l-1.5-4.5L8 20l4.5-1.5L14 14z" transform="scale(0.5) translate(4, 4)"></path></svg>
            </button>
          )}
          <select 
            value={note.format}
            onChange={(e) => onChange({ format: e.target.value as NoteFormat })}
            className="bg-(--surface-hover) border border-(--border-subtle) text-sm rounded-md px-2 py-1 outline-none focus:border-blue-500 text-(--text-primary)"
          >
            {FORMATS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
          </select>
        </div>
        
        <button
          onClick={() => onChange({ isPinned: !note.isPinned })}
          className={`p-1.5 rounded-md transition-colors ${note.isPinned ? 'text-amber-400 bg-amber-400/10' : 'text-(--text-muted) hover:bg-(--surface-hover)'}`}
          title={note.isPinned ? "Unpin snippet" : "Pin as global snippet"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={note.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
        </button>

        <button 
          onClick={onExport}
          className="text-(--text-muted) hover:text-blue-400 p-1.5 rounded-md hover:bg-(--surface-hover) transition-colors"
          title="Export Note"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>

        <button 
          onClick={onDelete}
          className="text-(--text-muted) hover:text-red-400 p-1.5 rounded-md hover:bg-(--surface-hover) transition-colors"
          title="Delete Note"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  );
}
