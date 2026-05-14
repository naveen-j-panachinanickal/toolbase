/**
 * OpenDraw Web Worker
 * Handles Python/Pyodide execution for graph processing.
 */
import { loadPyodide, type PyodideInterface } from "pyodide";
import { PYTHON_FILES } from "@/python/bundles/open_draw.bundle";

let pyodide: PyodideInterface | null = null;
let initPromise: Promise<PyodideInterface> | null = null;

/**
 * Posts a granular init progress message to the main thread.
 * WorkerClient listens for these and relays them to any UI subscriber.
 */
function postInitProgress(message: string): void {
    self.postMessage({ type: "INIT_PROGRESS", message });
}

/**
 * Initialize Pyodide and load the OpenDraw Python module.
 */
async function initPyodide(): Promise<PyodideInterface> {
    if (pyodide) return pyodide;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        postInitProgress("Loading runtime…");

        try {
            const py = await loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/",
            });

            postInitProgress("Preparing tool…");

            // Setup the virtual filesystem
            for (const [filePath, content] of Object.entries(PYTHON_FILES)) {
                const parts = filePath.split('/');
                let currentPath = '';

                for (let i = 0; i < parts.length - 1; i++) {
                    currentPath += (currentPath ? '/' : '') + parts[i];
                    try {
                        py.FS.mkdir(currentPath);
                    } catch {
                        // Directory might already exist
                    }
                }

                py.FS.writeFile(filePath, content);
            }

            // Import the main function
            await py.runPythonAsync(`
import sys
import os
sys.path.append(os.getcwd())

from tools.open_draw.main import process_command
            `);

            postInitProgress("Installing packages…");

            // Install networkx (optional — provides richer graph algorithms)
            try {
                await py.loadPackage('micropip');
                const micropip = py.pyimport('micropip');
                await micropip.install('networkx');
            } catch (e) {
                console.warn("[OpenDraw Worker] Could not install networkx, using fallback algorithms:", e);
            }

            pyodide = py;

            // Notify that worker is ready
            self.postMessage({ type: "READY" });

            return py;
        } catch (error) {
            initPromise = null;
            console.error("[OpenDraw Worker] Failed to initialize Pyodide:", error);
            throw error;
        }
    })();

    return initPromise;
}

/**
 * Handle incoming messages from the main thread.
 */
self.onmessage = async (event: MessageEvent) => {
    const message = event.data;
    const { type, id } = message;

    if (type === "INIT") {
        try {
            await initPyodide();
            // READY message is already sent in initPyodide
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            self.postMessage({
                type: "ERROR",
                id,
                error: `Failed to initialize: ${errorMessage}`
            });
        }
        return;
    }

    // For all other commands, ensure Pyodide is initialized
    try {
        const py = await initPyodide();

        const processCommand = py.globals.get("process_command");
        const pyMessage = py.toPy(message);
        const result = processCommand(pyMessage);
        const jsResult = result.toJs({ dict_converter: Object.fromEntries });

        self.postMessage(jsResult);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[OpenDraw Worker] Error processing command:", error);
        self.postMessage({
            type: "ERROR",
            id,
            error: errorMessage
        });
    }
};

// Re-enabled top-level initialization.
// This is safe because the worker itself is lazily spawned by the singleton factory
// only when the user actually navigates to the OpenDraw tool.
initPyodide().catch(console.error);
