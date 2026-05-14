import React from 'react';
import { Note } from '@/types/note-vault';

interface NoteListProps {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function NoteList({ notes, selectedId, onSelect }: NoteListProps) {
  if (notes.length === 0) {
    return <div className="text-sm text-gray-600 p-2 italic">No notes found.</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      {notes.map(note => (
        <div 
          key={note.id}
          onClick={() => onSelect(note.id)}
          className={`px-3 py-2 rounded-lg cursor-pointer flex flex-col transition-colors ${selectedId === note.id ? 'bg-gray-800 border-l-2 border-blue-500' : 'hover:bg-gray-800/50 border-l-2 border-transparent'}`}
        >
          <div className="flex justify-between items-center mb-1">
             <span className="text-sm font-medium text-gray-200 truncate">{note.title || 'Untitled'}</span>
             <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 uppercase font-mono">{note.format}</span>
          </div>
          <span className="text-xs text-gray-500 truncate">{new Date(note.updatedAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}
