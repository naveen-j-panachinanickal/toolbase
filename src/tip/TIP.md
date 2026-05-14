# TIP — Toolbase Interoperability Protocol v1.0

## Contributor Specification

> **Goal:** Read this document once. Implement a compliant TIPTool. Ship it.
> No other reading required.

---

## 1. What is TIP?

TIP is the communication protocol that every Toolbase tool speaks.

Because every tool speaks the same language, **every tool is automatically
chainable with every other tool** — without writing a single custom adapter.

Adding Tool #50 gives you compatibility with all 49 existing tools for free.

```
Before TIP:   tool-A ←→ tool-B  (custom adapter, breaks with every new tool)
After TIP:    tool-A  ←  TIP  →  tool-B  (zero adapters, scales forever)
```

---

## 2. The 5 Core Concepts

### 2.1 TIPPayload — A single unit of data

```typescript
interface TIPPayload {
  contentType: TIPContentType; // e.g. 'application/pdf'
  data: Blob; // the data itself — always a Blob
  meta: TIPPayloadMeta; // filename, size, provenance
}
```

**Key rule:** Data is always a `Blob`. Files uploaded by the user are already
`Blob`s (because `File extends Blob`). Returning computed data? Wrap it:

```typescript
new Blob([uint8Array], { type: "image/png" });
```

---

### 2.2 TIPBundle — Always an array

```typescript
interface TIPBundle {
  payloads: TIPPayload[]; // ALWAYS an array. Single file = length 1.
  contentType: TIPContentType; // dominant type (first payload's type)
  meta: TIPBundleMeta; // count, totalSizeBytes, createdAt
}
```

**Why bundles?** Tools never branch on "am I getting one file or many?" —
they always get a bundle. A PDF compressor that works on one PDF
automatically works on a batch of PDFs.

---

### 2.3 TIPTool — The tool interface

```typescript
interface TIPTool {
  id: string; // 'namespace/operation', e.g. 'magic-pdf/compress'
  name: string; // 'Compress PDF'
  description: string; // One sentence.
  consumes: TIPContentType[];
  produces: TIPContentType[];
  configSchema: TIPConfigSchema;
  invoke(
    input: TIPBundle,
    config: TIPConfig,
    hooks: TIPHooks,
  ): Promise<TIPBundle>;
}
```

---

### 2.4 TIPToolRegistry — The discovery hub

```typescript
TIPToolRegistry.register(tool); // register your tool
TIPToolRegistry.get("magic-pdf/compress"); // retrieve a tool by ID
TIPToolRegistry.findConsumers("application/pdf"); // tools that take PDFs
TIPToolRegistry.findNextSteps(currentType, canTransform); // step selector
TIPToolRegistry.discoverPath("application/pdf", "image/png"); // BFS routing
```

---

### 2.5 TIPEngine — The executor

```typescript
const result = await executeTIPPipeline(
  steps,
  initialBundle,
  engineHooks,
  signal,
);
```

The engine:

1. Resolves each `toolId` from the registry
2. Checks type compatibility (or finds a transformer)
3. Calls `tool.invoke()` with standard hooks
4. Stamps each output with producer metadata
5. Honours `AbortSignal` at every step boundary

You **do not** call the engine directly — use the `usePipelineEngine` React hook.

---

## 3. How to Implement a TIPTool

Here is a complete, working example — a tool that reverses the bytes of any file.

```typescript
// src/tip-tools/demo/reverse.tip.ts

import type { TIPTool } from "@/tip";
import { createBundle, createPayload } from "@/tip/bundle";

export const reverseBytesTool: TIPTool = {
  id: "demo/reverse-bytes",
  name: "Reverse Bytes",
  description:
    "Reverse the bytes of any file (a useless but illustrative demo).",

  // This tool accepts any binary data
  consumes: ["application/octet-stream"],
  produces: ["application/octet-stream"],

  configSchema: { fields: [] }, // No configuration needed

  async invoke(input, _config, hooks) {
    hooks.onProgress(0, "Starting...");

    const results = await Promise.all(
      input.payloads.map(async (payload, i) => {
        // 1. Read the Blob
        const buffer = await payload.data.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // 2. Do the work
        bytes.reverse();

        // 3. Check cancellation (important for long-running ops)
        if (hooks.signal.aborted) {
          throw new Error("Cancelled");
        }

        // 4. Wrap the result back into a payload
        const blob = new Blob([bytes], { type: "application/octet-stream" });

        hooks.onProgress(
          Math.round(((i + 1) / input.payloads.length) * 100),
          `Processed ${i + 1} of ${input.payloads.length}`,
        );

        return createPayload(
          blob,
          "application/octet-stream",
          payload.meta.filename,
        );
      }),
    );

    return createBundle(results);
  },
};
```

---

## 4. How to Register Your Tool

In your tool's `index.ts`, export the tool:

```typescript
// src/tip-tools/demo/index.ts
export { reverseBytesTool } from "./reverse.tip";
export const demoTools = [reverseBytesTool];
```

Then add it to the master registration file:

```typescript
// src/tip-tools/index.ts
import { demoTools } from "./demo";

export function registerAllTIPTools(): void {
  TIPToolRegistry.registerAll([
    // ... existing tools
    ...demoTools,
  ]);
}
```

That's it. Your tool is now chainable with every other tool in Toolbase.

---

## 5. Handling Multi-File Bundles

When a tool can receive multiple files (e.g., pixels/compress operates
on batches of images), process each payload individually:

```typescript
async invoke(input, config, hooks) {
  const results = await Promise.all(
    input.payloads.map(async (payload, i) => {
      hooks.onProgress(
        Math.round((i / input.payloads.length) * 100),
        `Processing image ${i + 1} of ${input.payloads.length}`
      );

      // process payload.data (a Blob)...
      const outputBlob = await compress(payload.data, config.quality as number);

      return createPayload(outputBlob, payload.contentType, payload.meta.filename);
    })
  );

  return createBundle(results);
}
```

---

## 6. Config Schema Reference

The `configSchema` drives the auto-rendered UI in the Pipeline Builder.
If your tool has no configuration, use `configSchema: { fields: [] }`.

```typescript
configSchema: {
  fields: [
    // Number slider
    {
      key: 'quality',
      label: 'Quality',
      type: 'number',
      default: 75,
      min: 1,
      max: 100,
      step: 1,
      unit: '%',
      description: 'Higher = better quality, larger file',
    },

    // Select dropdown
    {
      key: 'format',
      label: 'Output Format',
      type: 'select',
      default: 'png',
      options: [
        { label: 'PNG', value: 'png' },
        { label: 'JPEG', value: 'jpeg' },
        { label: 'WebP', value: 'webp' },
      ],
    },

    // Boolean toggle
    {
      key: 'preserveMetadata',
      label: 'Preserve Metadata',
      type: 'boolean',
      default: true,
    },

    // Password (redacted in UI)
    {
      key: 'password',
      label: 'Password',
      type: 'password',
      default: '',
      required: true,
    },
  ],
},
```

---

## 7. Error Handling Guide

### Throw TIPError for protocol-level failures

```typescript
import { TIPError } from "@/tip";

// Wrong type received
throw new TIPError(
  "TYPE_MISMATCH",
  "Expected a PDF bundle",
  stepIndex,
  tool.id,
);

// Required config missing
throw new TIPError(
  "CONFIG_INVALID",
  "Password is required",
  stepIndex,
  tool.id,
);

// Computation failed
throw new TIPError(
  "EXECUTION_FAILED",
  `Failed to compress: ${err.message}`,
  stepIndex,
  tool.id,
);
```

### Let the engine handle unexpected errors

If your code throws any `Error` that is NOT a `TIPError`, the engine wraps
it in `TIPError('EXECUTION_FAILED', ...)` automatically. So you only need
to throw `TIPError` when you have a protocol-specific reason.

### AbortSignal pattern

```typescript
async invoke(input, _config, hooks) {
  for (const payload of input.payloads) {
    // Check before each expensive operation
    if (hooks.signal.aborted) {
      throw new TIPError('CANCELLED', 'Tool cancelled by user');
    }
    await processExpensiveOperation(payload.data);
  }
}
```

---

## 8. The TIPHooks Contract

Every `invoke()` call receives three hooks:

```typescript
interface TIPHooks {
  onProgress: (percent: number, message?: string) => void;
  onLog: (message: string, level: "info" | "warn" | "error") => void;
  signal: AbortSignal;
}
```

| Hook                           | When to call                | Notes                               |
| ------------------------------ | --------------------------- | ----------------------------------- |
| `onProgress(0, 'Starting...')` | First line of invoke        | Always call at 0                    |
| `onProgress(100, 'Done')`      | Last line before return     | Always call at 100                  |
| `onProgress(n, message)`       | During processing           | Drives the live progress bar        |
| `onLog('msg', 'info')`         | Informational events        | Not shown in UI, goes to console    |
| `onLog('msg', 'warn')`         | Non-fatal issues            | Shown as warning in UI              |
| `onLog('msg', 'error')`        | Fatal issues (before throw) | Use before throwing TIPError        |
| `signal.aborted`               | Before each async op        | Throw TIPError('CANCELLED') if true |

---

## 9. Content Types Reference

| `TIPContentType`             | Use for                  |
| ---------------------------- | ------------------------ |
| `'application/pdf'`          | PDF documents            |
| `'image/png'`                | PNG images               |
| `'image/jpeg'`               | JPEG images              |
| `'image/webp'`               | WebP images              |
| `'image/gif'`                | GIF images               |
| `'text/plain'`               | Plain text files         |
| `'text/csv'`                 | CSV data files           |
| `'text/html'`                | HTML documents           |
| `'application/json'`         | JSON data                |
| `'application/zip'`          | ZIP archives             |
| `'application/octet-stream'` | Unknown / generic binary |

---

## 10. Privacy Guarantee

All TIPTool implementations **MUST**:

- ✅ Process data in-memory (Blobs, ArrayBuffers, TypedArrays)
- ✅ Use Web Workers for heavy computation
- ✅ Use WebAssembly/Pyodide for complex algorithms

All TIPTool implementations **MUST NOT**:

- ❌ Call `fetch()`, `axios()`, or any network API
- ❌ Write to or read from the filesystem (`FileSystem API` prohibited)
- ❌ Send data to any server, cloud service, or analytics endpoint
- ❌ Store data outside of in-memory structures

**Violation of the privacy guarantee is grounds for PR rejection.**

---

_TIP v1.0 — Toolbase Interoperability Protocol_
_Core Promise: Privacy. Security. Free for all. Premium-rich UX._
