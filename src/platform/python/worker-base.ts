import { loadPyodide, type PyodideInterface } from "pyodide";

/**
 * Configuration for initializing a Python worker.
 */
export interface PythonWorkerConfig {
  /** Human-readable name for logging and debugging. */
  name: string;
  /** List of standard Pyodide packages to preload (e.g., "pandas", "numpy"). */
  packages: string[];
  /** List of packages to install via micropip (e.g., from PyPI). */
  pipPackages?: string[];
  /** A dictionary of virtual files to mount in the worker's filesystem. */
  pythonFiles: Record<string, string>;
  /** The fully qualified name of the module containing 'handle_request'. */
  mainModule: string; // e.g. "tools.data_lens.main"
}

/**
 * Base class for all Python-backed workers in Toolbase.
 * 
 * Handles the lifecycle of the Pyodide runtime, virtual filesystem mounting,
 * package installation, and standardized message handling.
 * 
 * To use, create an instance and forward 'self.onmessage' to 'handleMessage'.
 */
export class PythonWorkerBase {
  private pyodidePromise: Promise<PyodideInterface> | null = null;
  private config: PythonWorkerConfig;

  constructor(config: PythonWorkerConfig) {
    this.config = config;
  }


  private postInitProgress(message: string): void {
    self.postMessage({ type: "INIT_PROGRESS", message });
  }

  private async initialize(): Promise<PyodideInterface> {
    this.postInitProgress("Loading runtime…");
    try {
      const pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/",
      });

      if (this.config.packages.length > 0 || (this.config.pipPackages && this.config.pipPackages.length > 0)) {
        this.postInitProgress("Installing packages…");
        await pyodide.loadPackage(["micropip", ...this.config.packages]);
        
        if (this.config.pipPackages && this.config.pipPackages.length > 0) {
          const micropip = pyodide.pyimport("micropip");
          await micropip.install(this.config.pipPackages);
        }
      }

      this.postInitProgress("Preparing tool…");

      // Mount virtual filesystem
      for (const [filePath, content] of Object.entries(this.config.pythonFiles)) {
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

      // Import main module and set handler
      await pyodide.runPythonAsync(`
import sys
import os
sys.path.append(os.getcwd())

import ${this.config.mainModule} as tool_main
handle_request = tool_main.handle_request
print("Python: ${this.config.name} handle_request imported successfully")
      `);

      self.postMessage({ type: "READY" });
      return pyodide;
    } catch (error) {
      console.error(`Worker [${this.config.name}]: Failed to initialize:`, error);
      throw error;
    }
  }

  /**
   * Returns the singleton Pyodide instance, initializing it if necessary.
   * @returns A promise that resolves to the PyodideInterface.
   */
  public getPyodide(): Promise<PyodideInterface> {
    if (!this.pyodidePromise) {
      this.pyodidePromise = this.initialize();
    }
    return this.pyodidePromise;
  }

  /**
   * Standardized message handler for Web Worker 'onmessage' events.
   * Dispatches EXECUTE commands to the Python 'handle_request' function.
   * 
   * @param event The message event from the main thread.
   */
  public async handleMessage(event: MessageEvent) {
    const { type, action, data, id } = event.data;

    if (type === "EXECUTE") {
      try {
        const py = await this.getPyodide();
        const handleRequest = py.globals.get("handle_request");

        if (!handleRequest) {
          throw new Error(`Python function 'handle_request' not found in ${this.config.name}`);
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

          // Force deep copy for binary results to avoid detached buffers
          if (jsResult instanceof Uint8Array) {
            jsResult = new Uint8Array(jsResult);
          }

          // Deep conversion for common structures like Pandas DataFrames converted to dicts
          if (jsResult && typeof jsResult === 'object') {
            for (const key in jsResult) {
              if (jsResult[key] && typeof jsResult[key].toJs === 'function') {
                jsResult[key] = jsResult[key].toJs({ dict_converter: Object.fromEntries, create_pyproxies: false });
                if (jsResult[key] instanceof Uint8Array) {
                  jsResult[key] = new Uint8Array(jsResult[key]);
                }
              }
            }
          }

          self.postMessage({ type: "RESULT", data: jsResult, id });

          if (result && typeof result.destroy === 'function') result.destroy();

        } finally {
          if (pyData && typeof pyData.destroy === 'function') pyData.destroy();
          // Explicit GC to keep memory usage low
          py.runPython('import gc; gc.collect()');
        }

      } catch (error: any) {
        console.error(`Worker [${this.config.name}]: Execution error:`, error);
        self.postMessage({ type: "ERROR", error: error.message, id });
      }
    }
  }
}
