'use client';

import React, { useState } from 'react';
import Header from '@/components/ui/Header';
import { useNoteVault } from '@/hooks/useNoteVault';
import { useNoteSearch } from '@/hooks/useNoteSearch';
import { useNoteWorker } from '@/hooks/useNoteWorker';
import { Vault } from 'lucide-react';
import { Note, NoteFormat } from '@/types/note-vault';
import NoteEditor from '@/components/features/note-vault/NoteEditor';
import NoteList from '@/components/features/note-vault/NoteList';
import NoteToolbar from '@/components/features/note-vault/NoteToolbar';
import NoteStats from '@/components/features/note-vault/NoteStats';
import { ReturnToToolsButton } from '@/components/ui/ReturnToToolsButton';

export default function NoteVaultPage() {
  const { notes, collections, isReady, addNote, updateNote, deleteNote, addCollection, deleteCollection } = useNoteVault();
  const { runTask } = useNoteWorker();
  
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('default');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = useNoteSearch(notes, searchQuery, selectedCollectionId);
  const selectedNote = notes.find(n => n.id === selectedNoteId);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      format: 'text',
      collectionId: selectedCollectionId,
      isPinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revisions: []
    };
    addNote(newNote);
    setSelectedNoteId(newNote.id);
  };

  if (!isReady) {
    return (
      <div className="flex flex-col h-screen bg-(--background) text-(--text-primary)">
        <div className="flex-1 flex items-center justify-center">
            <p className="text-(--text-muted)">Loading NoteVault...</p>
        </div>
      </div>
    );
  }

  const handleExportNote = (note: Note) => {
    const extMap: Record<NoteFormat, string> = {
      text: 'txt', markdown: 'md', code: 'txt', json: 'json', xml: 'xml',
      yaml: 'yaml', csv: 'csv', html: 'html', sql: 'sql', env: 'env', diff: 'diff', regex: 'txt'
    };
    const ext = extMap[note.format] || 'txt';
    const filename = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.${ext}`;
    const blob = new Blob([note.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAutoDetect = async (note: Note) => {
    if (!note.content.trim()) return;
    try {
      const format = await runTask('DETECT_FORMAT', note.content) as NoteFormat;
      if (format && format !== note.format) {
        updateNote({ ...note, format });
      }
    } catch (e) {
      console.error('Format auto-detect failed', e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-(--background) text-(--text-primary) font-display overflow-hidden">
      <header className="h-14 border-b border-(--border-subtle) bg-(--surface-overlay)/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
         <div className="flex items-center text-sm text-(--text-muted) gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
               <Vault size={16} />
            </div>
            <span className="font-semibold text-(--text-primary)">NoteVault</span>
         </div>
         <div className="flex items-center gap-2">
             <button 
                onClick={handleCreateNote}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-sm"
              >
                + New Note
              </button>
             <ReturnToToolsButton />
         </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-64 border-r border-(--border-subtle) flex flex-col bg-(--surface-hover)/30 shrink-0">
            <div className="p-4 border-b border-(--border-subtle) flex flex-col gap-3">
                <div className="relative">
                    <input 
                      type="text"
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-(--background) border border-(--border-subtle) rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 transition-colors text-(--text-primary) placeholder-(--text-muted)"
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                    <div className="text-xs font-semibold text-(--text-muted) mb-2 px-2 uppercase tracking-wider">Collections</div>
                    {collections.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => setSelectedCollectionId(c.id)}
                          className={`px-2 py-1.5 rounded-md cursor-pointer text-sm flex items-center justify-between group ${selectedCollectionId === c.id ? 'bg-(--surface-active) text-(--text-primary)' : 'text-(--text-muted) hover:bg-(--surface-hover) hover:text-(--text-primary)'}`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{backgroundColor: c.color}}></span>
                                {c.name}
                            </span>
                            <span className="text-xs text-(--text-faint) group-hover:text-(--text-muted)">
                                {notes.filter(n => n.collectionId === c.id).length}
                            </span>
                        </div>
                    ))}
                </div>
                
                <div className="p-2 border-t border-(--border-subtle)">
                    <div className="text-xs font-semibold text-(--text-muted) mb-2 px-2 uppercase tracking-wider">Notes</div>
                    <NoteList 
                        notes={filteredNotes} 
                        selectedId={selectedNoteId} 
                        onSelect={setSelectedNoteId} 
                    />
                </div>
            </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-(--background) min-w-0">
            {selectedNote ? (
                <>
                    <NoteToolbar 
                        note={selectedNote} 
                        onChange={(updates) => updateNote({...selectedNote, ...updates})}
                        onDelete={() => {
                            deleteNote(selectedNote.id);
                            setSelectedNoteId(null);
                        }}
                        onExport={() => handleExportNote(selectedNote)}
                        onAutoDetect={() => handleAutoDetect(selectedNote)}
                    />
                    <div className="flex-1 overflow-hidden relative">
                        <NoteEditor 
                            note={selectedNote} 
                            onChange={(content) => updateNote({...selectedNote, content})} 
                        />
                    </div>
                    <NoteStats note={selectedNote} />
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-(--text-muted)">
                    Select or create a note to begin
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
