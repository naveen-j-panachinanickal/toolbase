import { loadPyodide, type PyodideInterface } from "pyodide";
// @ts-ignore - The bundle file is auto-generated
import { PYTHON_FILES } from "@/python/bundles/pixels.bundle";

let pyodideInitPromise: Promise<PyodideInterface> | null = null;

/**
 * Posts a granular init progress message to the main thread.
 * WorkerClient listens for these and relays them to any UI subscriber.
 */
function postInitProgress(message: string): void {
    self.postMessage({ type: "INIT_PROGRESS", message });
}

async function loadPyodideAndPackages() {
    postInitProgress("Loading runtime…");
    try {
        const pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/",
        });

        postInitProgress("Installing packages…");
        await pyodide.loadPackage(["micropip"]);
        const micropip = pyodide.pyimport("micropip");
        await micropip.install(["Pillow", "numpy"]);

        postInitProgress("Preparing tool…");

        // Setup the virtual filesystem
        for (const [filePath, content] of Object.entries(PYTHON_FILES)) {
            const parts = filePath.split('/');
            let currentPath = '';

            // Create directories
            for (let i = 0; i < parts.length - 1; i++) {
                currentPath += (currentPath ? '/' : '') + parts[i];
                try {
                    pyodide.FS.mkdir(currentPath);
                } catch {
                    // Directory might already exist
                }
            }

            // Write file
            pyodide.FS.writeFile(filePath, content as string);
        }

        // Import the main function
        await pyodide.runPythonAsync(`
import sys
import os
sys.path.append(os.getcwd())
try:
    import tools.pixels.main as compressor_main
    handle_request = compressor_main.handle_request
    print("Python: handle_request imported successfully")
except Exception as e:
    init_error = str(e)
    import traceback
    traceback.print_exc()
        `);

        self.postMessage({ type: "READY" });
        return pyodide;
    } catch (error) {
        console.error("Worker: Failed to initialize Pyodide:", error);
        throw error;
    }
}

function getPyodide() {
    if (!pyodideInitPromise) {
        pyodideInitPromise = loadPyodideAndPackages();
    }
    return pyodideInitPromise;
}

self.onmessage = async (event: MessageEvent) => {
    const { type, action, data, id } = event.data;

    if (type === "EXECUTE") {
        try {
            const py = await getPyodide();

            const initError = py.globals.get("init_error");
            if (initError) {
                throw new Error(`Python Initialization Failed: ${initError}`);
            }

            const handleRequest = py.globals.get("handle_request");

            if (typeof handleRequest !== 'function') {
                throw new Error("Python function 'handle_request' not found.");
            }

            const pyData = py.toPy(data);

            try {
                const result = handleRequest(action, pyData);

                let jsResult;
                if (result && result.toJs) {
                    jsResult = result.toJs({ dict_converter: Object.fromEntries });
                } else {
                    jsResult = result;
                }

                self.postMessage({ type: "RESULT", data: jsResult, id });

                if (result && result.destroy) result.destroy();

            } finally {
                pyData.destroy();
            }

        } catch (error: any) {
            console.error("Worker: Execution error:", error);
            self.postMessage({ type: "ERROR", error: error.message, id });
        }
    }
};

// Re-enabled top-level initialization.
// This is safe because the worker itself is lazily spawned by the singleton factory
// only when the user actually navigates to the Pixels tool.
getPyodide().catch(console.error);
