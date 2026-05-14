export type PyodideInterface = {
  FS: {
    mkdir: (path: string) => void;
    writeFile: (path: string, content: string | Uint8Array) => void;
  };
  globals: {
    get: (name: string) => unknown;
  };
  pyimport: (name: string) => { install: (packages: string | string[], options?: Record<string, unknown>) => Promise<void> };
  loadPackage: (packages: string | string[]) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  runPython: (code: string) => unknown;
  toPy: (value: unknown) => { destroy?: () => void };
};

const PYODIDE_BASE_URL = "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/";

export async function loadPyodideRuntime(): Promise<PyodideInterface> {
  const pyodideModule = await import(
    /* webpackIgnore: true */
    `${PYODIDE_BASE_URL}pyodide.mjs`
  );

  return pyodideModule.loadPyodide({
    indexURL: PYODIDE_BASE_URL,
  }) as Promise<PyodideInterface>;
}
