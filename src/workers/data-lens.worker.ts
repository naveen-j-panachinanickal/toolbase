
import { loadPyodide, type PyodideInterface } from "pyodide";
// @ts-ignore - The bundle file is auto-generated
import { PYTHON_FILES } from "@/python/bundles/data_lens.bundle";

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

        // Pandas is large — this may take a few seconds
        await pyodide.loadPackage(["pandas", "sqlite3"]);
        await micropip.install(["openpyxl"]);

        postInitProgress("Preparing tool…");

        // Setup the virtual filesystem
        if (PYTHON_FILES) {
            for (const [filePath, content] of Object.entries(PYTHON_FILES)) {
                const parts = filePath.split('/');
                let currentPath = '';

                for (let i = 0; i < parts.length - 1; i++) {
                    currentPath += (currentPath ? '/' : '') + parts[i];
                    try {
                        pyodide.FS.mkdir(currentPath);
                    } catch {
                        // Directory might already exist
                    }
                }

                pyodide.FS.writeFile(filePath, content as string);
            }
        }

        // Import the main function
        await pyodide.runPythonAsync(`
import sys
import os
sys.path.append(os.getcwd())

import tools.data_lens.main as datalens_main
handle_request = datalens_main.handle_request
print("Python: DataLens handle_request imported successfully")
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
            const handleRequest = py.globals.get("handle_request");

            if (!handleRequest) {
                throw new Error("Python function 'handle_request' not found.");
            }

            const pyData = py.toPy(data);

            try {
                const result = handleRequest(action, pyData);

                let jsResult;
                if (result && typeof result.toJs === 'function') {
                    jsResult = result.toJs({ dict_converter: Object.fromEntries, create_pyproxies: false });
                } else {
                    jsResult = result;
                }

                // Ensure data array is fully converted
                if (jsResult && jsResult.data && typeof jsResult.data.toJs === 'function') {
                    jsResult.data = jsResult.data.toJs({ dict_converter: Object.fromEntries, create_pyproxies: false });
                }
                if (jsResult && jsResult.columns && typeof jsResult.columns.toJs === 'function') {
                    jsResult.columns = jsResult.columns.toJs();
                }

                self.postMessage({ type: "RESULT", data: jsResult, id });

                if (result && typeof result.destroy === 'function') result.destroy();

            } finally {
                if (pyData && typeof pyData.destroy === 'function') pyData.destroy();
            }

        } catch (error: any) {
            console.error("Worker: Execution error:", error);
            self.postMessage({ type: "ERROR", error: error.message, id });
        }
    }
};

// Re-enabled top-level initialization. 
// This is safe because the worker itself is lazily spawned by the singleton factory 
// only when the user actually navigates to the DataLens tool.
getPyodide().catch(console.error);
