# How to Build a Python-Based Tool

This guide provides a detailed walkthrough for building a tool using the Python/Pyodide stack in Toolbase.

## 1. Create the Python Logic
Create a new directory in `src/python/tools/<your-tool>/`.

### `main.py`
Every Python tool must have a `handle_request` function that acts as the entry point.

```python
import json

def handle_request(action, data):
    """
    The main entry point for the tool.
    action: string (e.g., 'process', 'analyze')
    data: dict (parsed JSON from JS)
    """
    if action == 'hello':
        name = data.get('name', 'World')
        return {"message": f"Hello {name} from Python!"}
    
    return {"error": "Unknown action"}
```

## 2. Generate the Bundle
Run the following command to convert your `.py` files into a TypeScript-friendly bundle:

```bash
npm run build:python
```
This generates `src/python/bundles/<your-tool>.bundle.ts`.

## 3. Create the Worker
Create `src/workers/<your-tool>.worker.ts`.

```typescript
import { loadPyodide } from "pyodide";
import { PYTHON_FILES } from "@/python/bundles/<your-tool>.bundle";

async function init() {
    const py = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/"
    });
    
    // Install dependencies if needed
    // await py.loadPackage(['pandas']);

    // Mount bundled files
    for (const [path, content] of Object.entries(PYTHON_FILES)) {
        py.FS.writeFile(path, content as string);
    }

    // Import and set handler
    await py.runPythonAsync(`
import tools.<your-tool>.main as tool_main
handle_request = tool_main.handle_request
    `);

    self.postMessage({ type: "READY" });
    return py;
}

const pyPromise = init();

self.onmessage = async (e) => {
    const py = await pyPromise;
    const { action, data, id } = e.data;
    
    const result = py.globals.get("handle_request")(action, py.toPy(data));
    self.postMessage({ type: "RESULT", data: result.toJs(), id });
};
```

## 4. Create the React Hook
Use `useDataLens` or `usePixels` as a template to create `src/hooks/use<YourTool>.ts`.

## 5. UI Integration
Use the `<EngineLoader>` component to handle the 5-10 second Pyodide warmup time gracefully.

---
*Created: May 2026*
*Toolbase Engineering Cookbook*
