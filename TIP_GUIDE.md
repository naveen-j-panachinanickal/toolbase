# TIP — Tool Integration Protocol

> **TIP** is the internal protocol that lets every Toolbase tool run the **same way**, whether the user is using it directly on the tool page or wiring it up as a node inside the Pipeline Builder.

---

## Table of Contents

1. [What is TIP?](#1-what-is-tip)
2. [Architecture Overview](#2-architecture-overview)
3. [Core Files and Roles](#3-core-files-and-roles)
4. [How TIP is Wired: End-to-End Flow](#4-how-tip-is-wired-end-to-end-flow)
5. [The `configSchema` — Single Source of Truth](#5-the-configschema--single-source-of-truth)
6. [Step-by-Step: Converting an Existing Tool to TIP](#6-step-by-step-converting-an-existing-tool-to-tip)
7. [Real Example: `pixel-axe/compress`](#7-real-example-pixel-axecompress)
8. [ConfigSchema Field Reference](#8-configschema-field-reference)
9. [Payload Formatter Rules](#9-payload-formatter-rules)
10. [Checklist](#10-checklist)

---

## 1. What is TIP?

**TIP (Tool Integration Protocol)** is a set of interfaces, conventions, and runtime wiring that makes every Toolbase tool work identically in two contexts:

| Context           | Where                     | Driven by                             |
| ----------------- | ------------------------- | ------------------------------------- |
| **Direct Tool**   | `/tools/<tool-name>` page | `useTIPTool` hook + feature component |
| **Pipeline Node** | `/tools/pipeline` canvas  | `InspectorPanel` + `PipelineRunner`   |

The key rule: **a tool's behaviour, parameters, and defaults are defined once — in `tools.registry.ts` — and consumed everywhere else.** No duplicated config, no drift between the two surfaces.

### Why it exists

Before TIP, each tool managed its own:

- Worker communication
- Parameter mapping
- Config keys and defaults

This led to the pipeline node for a tool having different parameters than the standalone page. TIP eliminates that by making **the registry the single source of truth**.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        tools.registry.ts                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ tip: {                                                    │   │
│  │   id, consumes, produces,                                 │   │
│  │   configSchema: { fields: [...] },   ← single source     │   │
│  │   getExecutor: async () => executor  ← worker bridge     │   │
│  │ }                                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────────┘
                 │ read by
       ┌─────────┴──────────┐
       ▼                    ▼
  Direct Tool          Pipeline Node
  ─────────────        ─────────────
  useTIPTool.ts        InspectorPanel.tsx
  (reads defaults)     (renders fields generically)
       │                    │
       └──────────┬─────────┘
                  ▼
          TIPToolRegistry
          tip/registry.ts
                  │
                  ▼
          tool.invoke(bundle, config)
                  │
                  ▼
          tip/executor.ts
          createPerPayloadTIPExecutor
                  │
                  ▼
          pixel-axe.worker.ts   (Web Worker)
                  │
                  ▼
          Python/WASM (Pyodide)
          python/tools/<tool>/main.py
```

---

## 3. Core Files and Roles

| File                                                  | Role                                                                                                                                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/config/tools.registry.ts`                        | **The registry.** Registers every tool with metadata + TIP config. The only place where `configSchema` and `getExecutor` are defined.                                   |
| `src/tip/protocol.ts`                                 | **Type definitions.** `TIPTool`, `TIPPayload`, `TIPBundle`, `TIPConfigSchema`, `TIPConfigField`. Read this before writing a new tool.                                   |
| `src/tip/registry.ts`                                 | **Runtime registry.** Loads `tools.registry.ts`, exposes `TIPToolRegistry.get(id)`, `findConsumers()`, `findProducers()`, etc.                                          |
| `src/tip/executor.ts`                                 | **Worker bridge.** `createPerPayloadTIPExecutor` and `createBatchTIPExecutor`. These send data to the Web Worker and parse the response.                                |
| `src/hooks/useTIPTool.ts`                             | **Direct-tool hook.** Used by standalone tool pages. Creates a `TIPBundle` from `File[]`, calls `tool.invoke()`, returns `File[]`.                                      |
| `src/workers/<name>.worker.ts`                        | **Web Worker.** Loads Pyodide, exposes `handle_request(action, data)`. One per tool family.                                                                             |
| `src/python/tools/<name>/main.py`                     | **Python entry point.** Routes `action` strings to the correct Python function.                                                                                         |
| `src/components/features/pipeline/InspectorPanel.tsx` | **Generic config UI.** Reads `tool.configSchema.fields` and renders the appropriate input widget for each field. No changes needed when you add fields to the registry. |

---

## 4. How TIP is Wired: End-to-End Flow

### Direct Tool path

```
User drops file
    → feature component (e.g. CompressImage.tsx)
        → useTIPTool('pixel-axe/compress')
            → TIPToolRegistry.get('pixel-axe/compress')
                → tool.invoke(bundle, config)
                    → getExecutor() → createPerPayloadTIPExecutor
                        → payloadFormatter(buffer, config)
                            → pixelAxeWorker.handle_request('compress', data)
                                → Python compress_image(data)
                                    → returns bytes
                        → outputTypeResolver(payload, config)
                    → returns TIPBundle
                → useTIPTool converts bundle → File[]
    → feature component displays result
```

### Pipeline Node path

```
User adds node to canvas
    → InspectorPanel reads tool.configSchema.fields
        → renders Quality slider, Format dropdown, etc.
    → (If interactable: true) User clicks "Configure"
        → FlowCanvas.tsx recursively resolves upstream files (previewFiles -> interactionFiles -> file)
        → Provides seed files to interaction component (e.g., SplitPdf.tsx)
        → Component saves configuration back to the node state
User clicks "Run Pipeline"
    → PipelineRunner iterates linearly through all nodes
    → No overrides: Engine always uses the upstream tool's freshly executed TIPBundle
    → tool.invoke(bundle, nodeConfig)
        → same path as above from getExecutor() onwards
```

The two paths **merge at `tool.invoke()`** — everything below is identical.

---

## 5. Interactable Nodes (`interactable: true`)

Some tools (like splitting a PDF or signing a document) cannot be configured purely via sliders and dropdowns; they require visual interaction with the document itself.

For these tools, you can define `interactable: true` and provide a `getInteractionComponent` in the registry:

```typescript
{
  id: 'magic-pdf/split',
  name: 'Split PDF',
  // ...
  interactable: true as const,
  getInteractionComponent: async () => {
    const { default: SplitPdf } = await import('@/components/features/magic-pdf/SplitPdf');
    return SplitPdf;
  },
  // ...
}
```

### The Configuration Lifecycle

1. **Upstream Resolution**: When a user clicks "Configure" on an interactable node in the Pipeline Builder, `FlowCanvas.tsx` recursively searches backward through the edge graph to find a representative file (e.g., the original File Input or a previously completed `previewFile`).
2. **Visual Configuration**: The user interacts with this "seed" file in the interaction component (e.g., drawing crop lines, selecting page ranges).
3. **Saving State**: The interaction component saves the chosen configuration (e.g., `pageRanges: '1-3'`) back to the node's `config`. It may also save mocked `interactionFiles` for downstream nodes to preview.
4. **Execution**: **Crucially, interactable nodes do not override the engine flow during a real run.** When the user clicks "Run Pipeline", the engine passes the strictly evaluated output of the previous step into the tool. The configuration picked by the user (like the crop coordinates) is applied to this new, runtime data.

---

## 6. The `configSchema` — Single Source of Truth

The `configSchema` serves **three purposes simultaneously**:

1. **Pipeline InspectorPanel** — renders configuration controls automatically
2. **Direct tool** — provides typed defaults via `useTIPTool`
3. **Executor** — drives what gets sent to the worker

```typescript
configSchema: {
  fields: [
    {
      key: "quality", // JS key used in config object
      label: "Quality", // UI label shown in Inspector
      type: "number", // field type → determines widget
      default: 80, // value used if user hasn't changed it
      min: 1,
      max: 100,
      step: 1,
      unit: "%",
      description: "Higher = better quality, larger file.",
    },
    // ...more fields
  ];
}
```

> **Rule:** If a parameter affects the Python worker, it **must** be in `configSchema`. Never add parameters in the component that skip the schema.

---

## 7. Step-by-Step: Converting an Existing Tool to TIP

### Prerequisites

- The tool has a working Web Worker (`src/workers/<name>.worker.ts`)
- The tool has a Python backend (`src/python/tools/<name>/main.py`)
- The tool has a feature component (`src/components/features/<name>/<Component>.tsx`)

---

### Step 1 — Add the TIP entry in `tools.registry.ts`

Open `src/config/tools.registry.ts`. Find the tool's existing `ToolMeta` entry in the `TOOLS` array and add a `tip` property:

```typescript
{
  id: 'my-tool',
  name: 'My Tool',
  // ...existing metadata...

  tip: [
    {
      id: 'my-tool/action',
      name: 'My Action',
      description: 'What this action does.',
      consumes: ['application/pdf'],     // MIME types this action accepts
      produces: ['application/pdf'],     // MIME types this action outputs

      // ── The configSchema: define every parameter here ──
      configSchema: {
        fields: [
          {
            key: 'quality',
            label: 'Quality',
            type: 'number',
            default: 80,
            min: 1,
            max: 100,
            step: 1,
            unit: '%',
            description: 'Compression quality.',
          },
          // Add ALL parameters your Python function accepts
        ]
      },

      // ── The executor: bridges the registry to the Web Worker ──
      getExecutor: async () => {
        const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
        const { myToolWorker } = await import('@/workers/instances');

        return createPerPayloadTIPExecutor(
          myToolWorker,
          'my-action',                    // must match the action string in main.py
          // Payload formatter: maps JS config keys → Python parameter names (snake_case)
          (buffer, config) => ({
            file_data: buffer,            // always pass the file buffer
            quality:   config.quality,    // map every configSchema key explicitly
          }),
          // Output type resolver: determines the MIME type of the result
          (payload, config) => 'application/pdf',
          'My Action'                     // label for progress display
        );
      }
    }
  ]
}
```

> ⚠️ **Always use explicit key mapping in the payload formatter.** Never spread `...config` — it will silently pass JS camelCase keys to Python which expects `snake_case`.

---

### Step 2 — Update the Python entry point (`main.py`)

Ensure the `action` string you used in `getExecutor` is handled:

```python
# src/python/tools/my_tool/main.py

def handle_request(action, data):
    if action == 'my-action':
        from .core.processor import process_file
        return process_file(data)
    else:
        return f"ERROR: Unknown action: {action}"
```

Your Python function receives the exact dict you built in the payload formatter:

```python
# src/python/tools/my_tool/core/processor.py

def process_file(data: dict) -> bytes:
    """
    Process the file according to config.
    Input keys match what the payload formatter sends.
    """
    file_bytes = bytes(data.get('file_data'))
    quality    = int(data.get('quality', 80))
    # ...
    return result_bytes
```

---

### Step 3 — Refactor the feature component to use `useTIPTool`

Replace any direct worker calls, `useMyToolHook`, etc. with `useTIPTool`:

```typescript
// src/components/features/my-tool/MyComponent.tsx

import { useTIPTool } from '@/hooks/useTIPTool';
import { useMemo, useState, useEffect } from 'react';

export function MyComponent() {
  const { execute, isProcessing, error, tool } = useTIPTool('my-tool/action');

  // ── Derive default config from the TIP schema ──
  // This ensures the component always starts with the same defaults
  // as the pipeline InspectorPanel — no drift possible.
  const defaultConfig = useMemo(
    () => Object.fromEntries(
      (tool?.configSchema.fields ?? []).map(f => [f.key, f.default])
    ),
    [tool]
  );

  const [config, setConfig] = useState<Record<string, any>>(defaultConfig);

  // Seed config when schema resolves (first mount)
  const seededRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current && Object.keys(defaultConfig).length > 0) {
      setConfig(defaultConfig);
      seededRef.current = true;
    }
  }, [defaultConfig]);

  const updateConfig = (key: string, value: any) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  // ── Execute the tool ──
  const handleRun = async () => {
    const resultFiles = await execute([inputFile], config);
    // resultFiles is File[] — use directly
  };

  return (
    <>
      {/* Read config.quality not a local quality state */}
      <Slider
        value={Number(config.quality ?? 80)}
        onChange={e => updateConfig('quality', Number(e.target.value))}
      />
      <Button onClick={handleRun} disabled={isProcessing}>Run</Button>
    </>
  );
}
```

---

### Step 4 — Verify the Pipeline Inspector Panel (no changes needed)

Open the pipeline, add your tool node, and click it. The InspectorPanel **automatically renders** every field defined in `configSchema.fields`. No code changes in `InspectorPanel.tsx` are required — it is fully generic.

If a field is missing from the inspector, that means it's missing from `configSchema` — go back to Step 1.

---

### Step 5 — Testing

| Test               | What to check                                                       |
| ------------------ | ------------------------------------------------------------------- |
| Direct tool page   | Tool works, config changes affect output, defaults match schema     |
| Pipeline node      | Inspector shows all config fields with correct defaults             |
| Pipeline execution | Node processes data and passes it to next node                      |
| Format mapping     | Output MIME type is correct (e.g. `image/webp` after format change) |

---

## 8. Real Example: `pixel-axe/compress`

This is a complete, working TIP implementation you can use as a reference.

### `tools.registry.ts` — the registration

```typescript
{
  id: 'pixel-axe/compress',
  name: 'Compress Images',
  description: 'Compress PNG, JPEG, or WebP images to reduce file size.',
  consumes: ['image/png', 'image/jpeg', 'image/webp'],
  produces: ['image/png', 'image/jpeg', 'image/webp'],

  configSchema: { fields: [
    {
      key: 'quality',
      label: 'Quality',
      type: 'number',
      default: 80,
      min: 1, max: 100, step: 1,
      unit: '%',
      description: 'Higher = better quality, larger file.',
    },
    {
      key: 'format',
      label: 'Output Format',
      type: 'select',
      default: 'JPEG',
      options: [
        { label: 'JPEG', value: 'JPEG' },
        { label: 'PNG',  value: 'PNG'  },
        { label: 'WEBP', value: 'WEBP' },
      ],
      description: 'Output image format.',
    },
    {
      key: 'resizeFactor',
      label: 'Image Scale',
      type: 'number',
      default: 1.0,
      min: 0.1, max: 1.0, step: 0.1,
      unit: '×',
      description: 'Scale the image before compression (1.0 = original size).',
    },
    {
      key: 'enhance',
      label: 'Auto Enhance',
      type: 'boolean',
      default: false,
      description: 'Apply subtle auto-enhancement to contrast and sharpness.',
    },
    {
      key: 'stripMetadata',
      label: 'Strip Metadata',
      type: 'boolean',
      default: true,
      description: 'Remove GPS, camera, and EXIF data from the output image.',
    },
  ] },

  getExecutor: async () => {
    const { createPerPayloadTIPExecutor } = await import('@/tip/executor');
    const { pixelAxeWorker } = await import('@/workers/instances');

    return createPerPayloadTIPExecutor(
      pixelAxeWorker,
      'compress',
      // JS camelCase → Python snake_case (always explicit, never spread)
      (buffer, config) => ({
        image_data:     buffer,
        quality:        config.quality,
        format:         config.format,
        resize_factor:  config.resizeFactor,   // ← camelCase → snake_case
        enhance:        config.enhance,
        strip_metadata: config.stripMetadata,  // ← camelCase → snake_case
      }),
      // Output MIME type resolver
      (payload, config) =>
        config.format
          ? `image/${String(config.format).toLowerCase()}` as any
          : payload.contentType,
      'Compress Images'
    );
  }
}
```

### `python/tools/pixel_axe/main.py` — routing

```python
def handle_request(action, data):
    if action == 'compress':
        resize_factor = float(data.get('resize_factor', 1.0))
        # Route to upscaler if scaling up, compressor otherwise
        if resize_factor > 1.0 or data.get('enhance') or data.get('denoise'):
            from .core.upscaler import upscale_image
            return upscale_image(data)
        else:
            from .core.compressor import compress_image
            return compress_image(data)
```

### `python/tools/pixel_axe/core/compressor.py` — implementation

```python
def compress_image(data: dict) -> bytes:
    """Compress an image with quality, format, resize, and metadata control."""
    image_bytes   = bytes(data.get('image_data'))
    quality       = int(data.get('quality', 80))
    target_format = data.get('format', 'JPEG').upper()
    resize_factor = float(data.get('resize_factor', 1.0))
    strip_meta    = data.get('strip_metadata', True)

    img = load_image(image_bytes)

    if resize_factor != 1.0:
        new_w = int(img.width * resize_factor)
        new_h = int(img.height * resize_factor)
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    return save_image(img, target_format, quality, strip_metadata=strip_meta)
```

### `CompressImage.tsx` — the direct tool component

```typescript
export function CompressImage() {
  const { execute, isProcessing, tool } = useTIPTool('pixel-axe/compress');

  // Config derived from the TIP schema — same source as the pipeline
  const defaultConfig = useMemo(
    () => Object.fromEntries(
      (tool?.configSchema.fields ?? []).map(f => [f.key, f.default])
    ),
    [tool]
  );
  const [config, setConfig] = useState<Record<string, any>>(defaultConfig);
  const updateConfig = (key: string, value: any) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  const handleCompress = async () => {
    // Pass config directly — no remapping needed here (done in payloadFormatter)
    const resultFiles = await execute([originalFile], config);
    // ...handle result
  };

  return (
    <>
      <Slider
        value={Number(config.quality ?? 80)}
        onChange={e => updateConfig('quality', Number(e.target.value))}
      />
      <Select
        value={String(config.format ?? 'JPEG')}
        onChange={v => updateConfig('format', v)}
        options={['JPEG', 'PNG', 'WEBP']}
      />
      {/* All 5 fields come from the same schema as the pipeline */}
    </>
  );
}
```

---

## 9. ConfigSchema Field Reference

Every field in `configSchema.fields` is a `TIPConfigField` object:

| Property      | Required    | Type                                            | Description                                             |
| ------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------- |
| `key`         | ✅          | `string`                                        | JavaScript key in the config object. Use **camelCase**. |
| `label`       | ✅          | `string`                                        | Human-readable label shown in the Inspector.            |
| `type`        | ✅          | `'number' \| 'string' \| 'boolean' \| 'select'` | Determines which widget to render.                      |
| `default`     | ✅          | `any`                                           | Default value. Must match the type.                     |
| `description` | —           | `string`                                        | Subtitle shown under the label.                         |
| `unit`        | —           | `string`                                        | Unit suffix shown next to value (e.g. `%`, `px`, `×`).  |
| `min`         | number only | `number`                                        | Minimum slider/input value.                             |
| `max`         | number only | `number`                                        | Maximum slider/input value.                             |
| `step`        | number only | `number`                                        | Increment for slider.                                   |
| `options`     | select only | `{ label: string; value: any }[]`               | Dropdown options.                                       |

### Widget mapping

| `type`    | Widget rendered in InspectorPanel |
| --------- | --------------------------------- |
| `number`  | Slider + number input             |
| `string`  | Text input                        |
| `boolean` | Toggle switch                     |
| `select`  | Dropdown select                   |

---

## 10. Payload Formatter Rules

The `payloadFormatter` in `getExecutor` is the **only** place where JS config keys are mapped to Python parameter names.

### Rules

1. **Always explicit** — list every key individually. Never use `{ ...config }`.
2. **camelCase → snake_case** — Python convention. Examples:
   - `resizeFactor` → `resize_factor`
   - `fillColor` → `fill_color`
   - `stripMetadata` → `strip_metadata`
   - `printDpi` → `print_dpi`
3. **File buffer first** — always pass the raw binary as the first key (usually `image_data`, `file_data`, or `pdf_data`).
4. **Boolean coercion** — Python's `data.get('key')` returns `None` when missing. In Python, `None` is falsy, so missing booleans are treated as `False`. This is usually correct but worth being aware of.

### Template

```typescript
(buffer, config) => ({
  file_data: buffer, // file buffer — always include
  param_one: config.paramOne, // camelCase → snake_case
  param_two: config.paramTwo,
  nested_key: config.nestedKey,
});
```

---

## 11. Checklist

Use this when converting or adding a TIP tool:

### Registry (`tools.registry.ts`)

- [ ] `id` follows the pattern `tool-name/action` (e.g. `pixel-axe/compress`)
- [ ] `consumes` lists all valid input MIME types
- [ ] `produces` lists all valid output MIME types
- [ ] Every Python parameter has a field in `configSchema.fields`
- [ ] Every field has: `key`, `label`, `type`, `default`
- [ ] Payload formatter maps every key **explicitly** (no spread)
- [ ] camelCase JS keys are snake_cased for Python
- [ ] Output type resolver returns the correct MIME type

### Python (`main.py` + core module)

- [ ] `handle_request` handles the action string used in `getExecutor`
- [ ] All parameter keys match what the payload formatter sends
- [ ] Function has a docstring

### Feature Component

- [ ] Uses `useTIPTool('tool-id/action')` — not a direct worker call
- [ ] Config state is derived from `tool.configSchema.fields` defaults
- [ ] Uses a single `config` object + `updateConfig` helper
- [ ] `execute(files, config)` is called — not `execute(files, { ...local vars })`
- [ ] No manual parameter remapping in the component (that's the formatter's job)

### Pipeline

- [ ] Add the node to the pipeline and open InspectorPanel
- [ ] All config fields appear with correct labels and default values
- [ ] Running the pipeline node produces expected output

---

_Last updated: 2026-03-10_
