# NoteVault

## Purpose
A developer-centric local note-taking app that treats notes as typed, structured artifacts instead of rich text documents.

## Inputs
- Raw text (Markdown, JSON, XML, Code, etc.)
- Auto-detect formats when pasting or importing files

## Outputs
- Download files in their raw formats (.json, .md, .txt)
- View parsed content and metadata
- Export collections to ZIP

## Limits
- IndexedDB storage limits apply (usually gigs of data allowed, but bound by browser constraints).
- Designed for snippets and textual configuration, not multi-gigabyte files.

## Privacy Guarantee
All processing, format detection, conversions, and storage happen entirely client-side using Web Workers and IndexedDB. Nothing is ever sent to a server.
