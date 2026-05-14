import { useMemo } from 'react';
import { Note } from '../types/note-vault';

export function useNoteSearch(notes: Note[], query: string, collectionId?: string) {
  return useMemo(() => {
    let filtered = notes;
    
    if (collectionId) {
      filtered = filtered.filter(n => n.collectionId === collectionId);
    }
    
    if (!query.trim()) return filtered;
    
    const lowerQuery = query.toLowerCase();
    
    return filtered.filter(note => {
      const matchTitle = note.title.toLowerCase().includes(lowerQuery);
      const matchContent = note.content.toLowerCase().includes(lowerQuery);
      const matchTags = note.tags.some(t => t.toLowerCase().includes(lowerQuery));
      return matchTitle || matchContent || matchTags;
    });
  }, [notes, query, collectionId]);
}
