/**
 * SystemCapabilities Utility
 * 
 * Provides a centralized way to check for modern browser primitives 
 * (WebGPU, WASM, SharedArrayBuffer) and determine the optimal 
 * performance mode for the user.
 */

export interface CapabilityReport {
  webGPU: boolean;
  wasm: boolean;
  sharedArrayBuffer: boolean;
  hardwareConcurrency: number;
  isHighPerformance: boolean;
  recommendedMode: 'high' | 'compatibility';
}

let cachedReport: CapabilityReport | null = null;

export async function getSystemCapabilities(): Promise<CapabilityReport> {
  if (cachedReport) return cachedReport;

  const wasmSupported = (() => {
    try {
      if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
        const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
        if (module instanceof WebAssembly.Module)
          return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
    } catch (e) {}
    return false;
  })();

  const webGPUSupported = typeof navigator !== 'undefined' && 'gpu' in navigator;
  let webGPUActive = false;
  
  if (webGPUSupported) {
    try {
      const nav = navigator as any;
      const adapter = await nav.gpu.requestAdapter();
      webGPUActive = !!adapter;
    } catch (e) {
      webGPUActive = false;
    }
  }

  const sabSupported = typeof SharedArrayBuffer !== 'undefined';
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;

  const isHighPerformance = webGPUActive && wasmSupported;

  cachedReport = {
    webGPU: webGPUActive,
    wasm: wasmSupported,
    sharedArrayBuffer: sabSupported,
    hardwareConcurrency: cores,
    isHighPerformance,
    recommendedMode: isHighPerformance ? 'high' : 'compatibility',
  };

  return cachedReport;
}
