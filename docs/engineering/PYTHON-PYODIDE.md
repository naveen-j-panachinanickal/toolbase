# Python and Pyodide in Toolbase

## Overview
Toolbase uses **Pyodide** to run real Python code directly in the browser. This allows us to leverage mature libraries like `pandas`, `openpyxl`, and `networkx` while maintaining our commitment to 100% local processing.

## Why Toolbase uses Python
While Rust is preferred for performance-critical byte processing, Python is used for:
- **Data Engineering**: Using `pandas` for CSV/Excel manipulation.
- **Complex Algorithms**: Using specialized libraries like `networkx` for graph processing.
- **Rapid Feature Migration**: Porting existing logic from backend Python tools to the browser.

## Architecture
Python tools follow a "Worker Singleton" pattern to avoid blocking the UI thread and to cache the large Pyodide runtime.

### Layers
1. **Python Source**: Located in `src/python/tools/<tool_name>/`.
2. **Bundler**: `scripts/build-python-bundler.mjs` converts Python files into a TypeScript string bundle.
3. **Generated Bundle**: `src/python/bundles/<tool_name>.bundle.ts`.
4. **Worker**: `src/workers/<tool_name>.worker.ts` loads Pyodide and the bundle.
5. **Bridge/Hook**: `src/hooks/use<ToolName>.ts` manages communication with the worker.

## The Build Pipeline
Since browsers cannot natively read local `.py` files from the filesystem, we bundle them into TypeScript constants.

### npm scripts
```json
{
  "build:python": "node scripts/build-python-bundler.mjs",
  "watch:python": "nodemon --watch src/python -e py --exec \"npm run build:python\""
}
```

The bundler recursively scans the Python directory and creates a virtual filesystem mapping in a `.bundle.ts` file.

## Worker Implementation
A typical Python worker performs the following steps:
1. **Load Pyodide**: Fetches the runtime from a CDN (cached by the Service Worker).
2. **Install Packages**: Uses `micropip` to install dependencies (e.g., `pandas`).
3. **Mount Filesystem**: Injects the bundled Python code into Pyodide's virtual FS.
4. **Export Handler**: Exposes a `handle_request` function to the main thread.

## Best Practices
- **Lazy Loading**: Never initialize Pyodide on the home page. Always use a lazy factory or initialize when the tool is opened.
- **Granular Progress**: Use `self.postMessage({ type: "INIT_PROGRESS", message })` to inform the user during the 5-10 second loading phase.
- **Memory Management**: Explicitly call `.destroy()` on Pyodide proxies to avoid memory leaks in the browser.
- **Error Handling**: Wrap the `runPython` calls in try-catch blocks and relay the traceback back to the UI.

## Adding a New Python Tool
1. Create your logic in `src/python/tools/my-tool/main.py`.
2. Run `npm run build:python` to generate the bundle.
3. Create a worker in `src/workers/my-tool.worker.ts`.
4. Use the `EngineLoader` component in your UI to show the loading state.

---
*Created: May 2026*
*Part of the Toolbase Engineering Standards*
