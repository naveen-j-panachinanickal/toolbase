export type NoteFormat =
  | 'text' | 'markdown' | 'code' | 'json' | 'xml'
  | 'yaml' | 'csv' | 'html' | 'sql' | 'env'
  | 'diff' | 'regex';

export interface NoteRevision {
  content: string;
  savedAt: string; // ISO timestamp
}

export interface Note {
  id: string;           // uuid
  title: string;
  content: string;
  format: NoteFormat;
  language?: string;    // for 'code' format: 'python', 'ts', etc.
  collectionId: string;
  isPinned: boolean;    // global snippet
  tags: string[];
  createdAt: string;
  updatedAt: string;
  revisions: NoteRevision[]; // last 10 only
}

export interface Collection {
  id: string;
  name: string;
  color: string;        // accent color for sidebar
  createdAt: string;
}

export interface NoteVaultStore {
  notes: Note[];
  collections: Collection[];
  version: number;
}
