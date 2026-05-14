import { useState, useEffect, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { Note, Collection, NoteFormat, NoteRevision, NoteVaultStore } from '../types/note-vault';

const DB_NAME = 'note-vault-db';
const DB_VERSION = 1;
const STORE_NOTES = 'notes';
const STORE_COLLECTIONS = 'collections';

// Default collection
const defaultCollection: Collection = {
  id: 'default',
  name: 'All Notes',
  color: '#8b5cf6', // Violet
  createdAt: new Date().toISOString()
};

export async function getPinnedNotes(): Promise<Note[]> {
  try {
    const database = await openDB(DB_NAME, DB_VERSION);
    if (!database.objectStoreNames.contains(STORE_NOTES)) return [];
    const tx = database.transaction(STORE_NOTES, 'readonly');
    const allNotes: Note[] = await tx.objectStore(STORE_NOTES).getAll();
    return allNotes.filter(n => n.isPinned);
  } catch (e) {
    return [];
  }
}

export function useNoteVault() {
  const [db, setDb] = useState<IDBPDatabase | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [collections, setCollections] = useState<Collection[]>([defaultCollection]);
  const [isReady, setIsReady] = useState(false);

  // Initialize DB
  useEffect(() => {
    const initDb = async () => {
      const database = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NOTES)) {
            db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_COLLECTIONS)) {
            db.createObjectStore(STORE_COLLECTIONS, { keyPath: 'id' });
          }
        },
      });
      setDb(database);

      // Load collections
      const tx = database.transaction(STORE_COLLECTIONS, 'readonly');
      const savedCollections = await tx.objectStore(STORE_COLLECTIONS).getAll();
      if (savedCollections.length > 0) {
        setCollections(savedCollections);
      } else {
        // Save default collection if empty
        const writeTx = database.transaction(STORE_COLLECTIONS, 'readwrite');
        await writeTx.objectStore(STORE_COLLECTIONS).put(defaultCollection);
      }

      // Load notes
      const notesTx = database.transaction(STORE_NOTES, 'readonly');
      const savedNotes = await notesTx.objectStore(STORE_NOTES).getAll();
      setNotes(savedNotes);

      setIsReady(true);
    };

    initDb();
  }, []);

  const addNote = useCallback(async (note: Note) => {
    if (!db) return;
    const tx = db.transaction(STORE_NOTES, 'readwrite');
    await tx.objectStore(STORE_NOTES).put(note);
    setNotes(prev => [...prev, note]);
  }, [db]);

  const updateNote = useCallback(async (note: Note) => {
    if (!db) return;
    const tx = db.transaction(STORE_NOTES, 'readwrite');
    
    // Manage revisions
    const oldNote = notes.find(n => n.id === note.id);
    if (oldNote && oldNote.content !== note.content) {
        const newRevision: NoteRevision = {
            content: oldNote.content,
            savedAt: new Date().toISOString()
        };
        const newRevisions = [newRevision, ...(oldNote.revisions || [])].slice(0, 10);
        note.revisions = newRevisions;
    }
    
    note.updatedAt = new Date().toISOString();
    
    await tx.objectStore(STORE_NOTES).put(note);
    setNotes(prev => prev.map(n => n.id === note.id ? note : n));
  }, [db, notes]);

  const deleteNote = useCallback(async (id: string) => {
    if (!db) return;
    const tx = db.transaction(STORE_NOTES, 'readwrite');
    await tx.objectStore(STORE_NOTES).delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [db]);

  const addCollection = useCallback(async (collection: Collection) => {
    if (!db) return;
    const tx = db.transaction(STORE_COLLECTIONS, 'readwrite');
    await tx.objectStore(STORE_COLLECTIONS).put(collection);
    setCollections(prev => [...prev, collection]);
  }, [db]);

  const deleteCollection = useCallback(async (id: string) => {
    if (!db || id === 'default') return; // Cannot delete default
    
    // First update all notes in this collection to default
    const txNotes = db.transaction(STORE_NOTES, 'readwrite');
    const store = txNotes.objectStore(STORE_NOTES);
    const affectedNotes = notes.filter(n => n.collectionId === id);
    
    for (const note of affectedNotes) {
        const updatedNote = { ...note, collectionId: 'default' };
        await store.put(updatedNote);
    }
    
    setNotes(prev => prev.map(n => n.collectionId === id ? { ...n, collectionId: 'default' } : n));

    const txCol = db.transaction(STORE_COLLECTIONS, 'readwrite');
    await txCol.objectStore(STORE_COLLECTIONS).delete(id);
    setCollections(prev => prev.filter(c => c.id !== id));
  }, [db, notes]);

  return {
    notes,
    collections,
    isReady,
    addNote,
    updateNote,
    deleteNote,
    addCollection,
    deleteCollection
  };
}
