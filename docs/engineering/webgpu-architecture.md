# WebGPU & Universal Performance Architecture

This document outlines the implementation of the **Universal Performance Architecture** in Toolbase. This system ensures that the application remains high-performance for cutting-edge hardware while remaining fully functional on older browsers and devices.

## 1. Core Philosophy: "Universal-First"

Instead of forcing users to have cutting-edge hardware (WebGPU), Toolbase uses a **Graceful Degradation** strategy:
1.  **High-Performance Mode**: Uses WebGPU for hardware acceleration (e.g., AI models, heavy computations).
2.  **Compatibility Mode**: Automatically falls back to WebAssembly (WASM) or pure JavaScript (CPU-bound) when WebGPU is unavailable.

## 2. Detection Logic (`src/utils/SystemCapabilities.ts`)

The detection engine is a centralized utility that checks for browser primitives once at startup.

```typescript
export interface CapabilityReport {
  webGPU: boolean;
  wasm: boolean;
  sharedArrayBuffer: boolean;
  hardwareConcurrency: number;
  isHighPerformance: boolean;
  recommendedMode: 'high' | 'compatibility';
}
```

It performs a "handshake" with the browser to verify if `navigator.gpu` is not only present but capable of requesting an adapter.

## 3. Global State Management (`src/components/providers/CapabilityProvider.tsx`)

A React Context provider wraps the application root, making the `CapabilityReport` available to any component or hook via the `useCapabilities()` hook.

- **Initialization**: Runs once on mount (client-side).
- **Transparency**: Provides the data needed for UI status indicators.

## 4. UI Transparency & "Privacy Proof"

Following the principle of transparency, we don't hide the performance mode from the user. Instead, we integrate it into the **Privacy Proof** panel (`PrivacyBadge.tsx`).

- **Emerald Badge**: "WebGPU Accelerated" (High Performance).
- **Orange Badge**: "Compatibility Mode" (Safe/Stable Performance).

This builds trust by explaining *why* the app might behave differently on different devices.

## 5. Implementation Example: `useWebLLM.ts`

The AI engine uses this architecture to select the optimal model and runtime:

```typescript
// Pseudocode of the logic
const capabilities = useCapabilities();

const modelConfig = capabilities?.webGPU 
  ? { modelId: 'Llama-3-8B-WebGPU', mode: 'gpu' }
  : { modelId: 'TinyLlama-1.1B-WASM', mode: 'cpu' };
```

## 6. How to Implement in New Tools

When building a heavy-compute tool:
1.  **Import the Hook**: `import { useCapabilities } from '@/components/providers/CapabilityProvider';`
2.  **Branch Logic**: Check `capabilities.webGPU` to decide which worker or algorithm to load.
3.  **Inform the User**: The `PrivacyBadge` will automatically pick up the status and show it in the "Performance" section.

---
*Created: May 2026*
*Part of the Toolbase Engineering Standards*
