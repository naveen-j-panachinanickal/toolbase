import { loadPyodide, type PyodideInterface } from "pyodide";
// @ts-ignore - The bundle file is auto-generated
import { PYTHON_FILES } from "@/python/bundles/pixel_axe.bundle";

let pyodideInitPromise: Promise<PyodideInterface> | null = null;

async function loadPyodideAndPackages() {
    console.log("Worker: Initializing Pyodide...");
    try {
        const pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.2/full/",
        });

        // Install dependencies
        console.log("Worker: Installing Pillow and NumPy...");
        await pyodide.loadPackage(["micropip"]); 
        const micropip = pyodide.pyimport("micropip");
        await micropip.install(["Pillow", "numpy"]); 

        console.log("Worker: Pyodide loaded, setting up filesystem...");

        // Setup the virtual filesystem
        for (const [filePath, content] of Object.entries(PYTHON_FILES)) {
            const parts = filePath.split('/');
            let currentPath = '';

            // Create directories
            for (let i = 0; i < parts.length - 1; i++) {
                currentPath += (currentPath ? '/' : '') + parts[i];
                try {
                    pyodide.FS.mkdir(currentPath);
                } catch (e) {
                    // Directory might already exist
                }
            }

            // Write file
            pyodide.FS.writeFile(filePath, content as string);
        }

        console.log("Worker: Python files written to virtual FS.");

        // Import the main function
        await pyodide.runPythonAsync(`
import sys
import os
print(f"Current CWD: {os.getcwd()}")
try:
    sys.path.append(os.getcwd())
    import tools.pixel_axe.main as compressor_main
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

            // Convert input data to Python dict
            const pyData = py.toPy(data);

            try {
                const result = handleRequest(action, pyData);

                // Convert result back to JS
                let jsResult;
                if (result && result.toJs) {
                    jsResult = result.toJs({dict_converter: Object.fromEntries});
                } else {
                    jsResult = result;
                }

                self.postMessage({ type: "RESULT", data: jsResult, id });

                 if (result && result.destroy) result.destroy();

            } finally {
                pyData.destroy();
                // py.runPython('import gc; gc.collect()'); 
            }

        } catch (error: any) {
            console.error("Worker: Execution error:", error);
            self.postMessage({ type: "ERROR", error: error.message, id });
        }
    }
};

getPyodide().catch(console.error);
