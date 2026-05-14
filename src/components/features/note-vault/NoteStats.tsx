import React from 'react';
import { Note } from '@/types/note-vault';

export default function NoteStats({ note }: { note: Note }) {
  const content = note.content || '';
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content ? content.split('\n').length : 0;
  
  const sizeBytes = new Blob([content]).size;
  const sizeFormatted = sizeBytes > 1024 ? `${(sizeBytes / 1024).toFixed(1)} KB` : `${sizeBytes} B`;

  return (
    <div className="h-8 border-t border-gray-800 bg-gray-900 flex items-center px-4 text-xs text-gray-500 gap-4 select-none">
      <span>{charCount} chars</span>
      <span>{wordCount} words</span>
      <span>{lineCount} lines</span>
      <span>{sizeFormatted}</span>
      <span className="flex-1 text-right text-blue-500/70">{note.format.toUpperCase()}</span>
    </div>
  );
}
