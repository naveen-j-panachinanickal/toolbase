import { ToolMeta } from "@/types/tool-search";

export const noteVaultConfig: ToolMeta = {
  id: 'note-vault',
  name: 'NoteVault',
  description: 'A developer-centric, content-type aware local note taking tool.',
  longDescription:
    'Store your JSON, XML, Markdown, Code, and plain text securely in your browser. Features auto-format detection, instant fuzzy search, conversions, version history, and zip export. Fully offline and private.',
  category: 'developer',
  route: 'note-vault',
  thumbnail: '/assets/thumbnails/note-vault.png',
  tags: ['notes', 'snippets', 'json', 'markdown', 'code', 'local', 'private', 'storage'],
  isNew: true,
  isFeatured: true,
  wasmPowered: false,
  pythonPowered: false,
  status: 'stable',
  addedAt: '2026-05-07',
  mobileOptimized: true,
  tip: []
};
