# Archive Kit

Archive Kit is a browser-local archive utility for ZIP, TAR, and TGZ workflows powered by Rust WebAssembly.

## Features
1. Create archives from selected files (`.zip`, `.tar`, `.tgz`).
2. Choose ZIP compression mode (`store`, `fast`, `best`).
3. Add full folders with relative path preservation.
4. Inspect archive contents (list entries and sizes).
5. Extract files from archives and save locally.
6. Repackage extracted files with one-click `Download All as ZIP`.
7. Search/filter archive entries during inspection.
8. Validate archive structure before extraction.
9. Preview and save individual files directly from the inspect table.
10. Bulk inspect and extract for multiple archives in one run.
11. Worker-based processing with progress bar and cancel support.
12. Background queue mode with retry for failed jobs.
13. Partial extract from selected entries.
14. Deterministic archive mode for reproducible outputs.
15. Rich preview support (text/JSON/XML/CSV/image).
16. Local benchmark telemetry (operation time and size stats).

## Privacy
All processing runs in the browser. No files are uploaded.

## Notes
1. ZIP creation supports `store`, `fast`, and `best` modes.
2. ZIP extraction supports stored files and deflate entries.
3. Password-protected ZIP create/extract is supported through Rust WASM (AES mode).
4. Security checks highlight suspicious paths and duplicate collisions.
5. Large file ingestion is streamed in the worker (not main-thread whole-buffer reads).
6. TGZ (`tar.gz`) create/list/extract is supported directly by the Rust engine.

## Rust Engine
Rust source lives in:
- `rust/archive-kit`

Manual build command:
```bash
npm run build:archive-kit:wasm
```

This generates browser artifacts under:
- `public/wasm/archive-kit/pkg`

At runtime, the tool requires the Rust WASM artifacts. If they are missing, Archive Kit reports engine unavailability instead of falling back to TypeScript.

## Dev Workflow (project-wide)
`npm run dev` now starts:
1. Next.js dev server
2. Python bundle watcher
3. Rust WASM watcher (`rust/**` -> `public/wasm/**`)

When Rust files change, WASM artifacts are rebuilt automatically.
