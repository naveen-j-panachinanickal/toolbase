# Tutorial: Adding a New Tool to Toolbase

This guide walks you through the process of adding a new utility to Toolbase, from backend logic to UI integration.

## 1. Choose Your Engine
- **Pure JavaScript**: Best for simple text transformations or light computations.
- **Rust/WASM**: Best for high-performance byte processing (PDFs, Images, Archives).
- **Python/Pyodide**: Best for data science, Excel/CSV manipulation, or complex math libraries.

## 2. Register the Tool
Add your tool metadata to `src/config/tools.registry.ts`. This makes it searchable and visible on the home page.

```typescript
{
  id: 'my-new-tool',
  name: 'My New Tool',
  description: 'A brief description of what it does.',
  route: '/my-new-tool',
  thumbnail: '/assets/thumbnails/my-new-tool.png',
  tags: ['category', 'privacy'],
  wasmPowered: true, // or pythonPowered: true
}
```

## 3. Implement the Backend Logic

### For Rust
1. Create a new crate in `rust/my-tool`.
2. Add it to `rust/Cargo.toml` workspace.
3. Export your functions using `#[wasm_bindgen]`.
4. Run `npm run build:wasm`.

### For Python
1. Create `src/python/tools/my-tool/main.py`.
2. Ensure you have a `handle_request(action, data)` function.
3. Run `npm run build:python`.

## 4. Create the Web Worker
Workers keep the UI responsive.
1. Create `src/workers/my-tool.worker.ts`.
2. Use `WorkerClient` or a bespoke implementation to handle messages.
3. Ensure you send a `READY` message once initialization is complete.

## 5. Create the React Hook
Encapsulate the worker communication in a hook: `src/hooks/useMyTool.ts`.
- Handle state: `isReady`, `isProcessing`, `error`, `result`.
- Provide methods: `processData()`, `clear()`.

## 6. Build the UI Page
Create the tool page in `src/app/(tools)/my-new-tool/page.tsx`.

### Standard Components to Use:
- `<ToolHeader>`: For the title, description, and back button.
- `<FileUploader>`: If your tool processes files.
- `<EngineLoader>`: To show WASM/Python warmup progress.
- `<PrivacyBadge>`: **Mandatory** on every tool page to show "Private & Local" proof.
- `<ToolSidebar>`: For settings and options.

## 7. Performance & Privacy Check
- **WebGPU**: If your tool is extremely heavy, check `useCapabilities()` to decide if you should use a lighter fallback.
- **Privacy Proof**: Ensure your tool only processes data in the browser (no `fetch` calls to external APIs).

## 8. Verification
- Run `npm run build` to ensure no TypeScript or bundling errors.
- Verify the "Privacy Proof" panel correctly identifies your engine (WASM/Python).

---
*Created: May 2026*
*Part of the Toolbase Engineering Standards*
