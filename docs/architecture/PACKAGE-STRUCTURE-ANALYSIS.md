# Package Structure Analysis & Optimization Plan

## Current State Observations

The Toolbase codebase follows a "Layered Architecture" (grouping by file type: hooks, workers, types). While this works for small projects, it is starting to show signs of **"Fragmentation Strain"** as the tool count grows.

### Key Issues Identified:
1. **Fragmentation of Features**: To understand a single tool like `Archive Kit`, a developer must look into `src/app/(tools)/archive-kit`, `src/hooks/useArchiveKitWorker.ts`, `src/workers/archive-kit.worker.ts`, `src/lib/archive-kit.ts`, and `src/types/archive-kit.ts`.
2. **Hook Fatigue**: `src/hooks/` is a flat directory with 40+ files, making it difficult to distinguish between global UI hooks and heavy worker-orchestration hooks.
3. **Type Isolation**: Types are separated from the logic that uses them, leading to excessive cross-directory imports.
4. **Engine Overlap**: We have `src/workers/client.ts` (modern) vs. bespoke worker management in `src/hooks/useDataLens.ts` (legacy).
5. **Redundant Utils**: `src/utils` contains only one file, while `src/lib` contains many utility-like files.

---

## Proposed Structural Refactor

I recommend transitioning to a **Domain-Driven Feature Structure** while respecting Next.js route conventions.

### 1. Feature-Based Colocation
Move tool-specific logic into dedicated feature folders.

```text
src/features/
  <tool-name>/
    hooks/          # Tool-specific hooks
    components/     # Tool-specific components
    types.ts        # Tool-specific types
    constants.ts    
    api.ts          # Logic for talking to workers/bridges
```

### 2. Standardized Worker Management
Consolidate all workers into a structured `src/core/workers` directory.
- Move `src/workers/client.ts` to `src/core/workers/WorkerClient.ts`.
- Move worker implementation files to `src/core/workers/definitions/`.

### 3. Organized Hooks Directory
Categorize global hooks to reduce cognitive load.
```text
src/hooks/
  common/           # useDebounce, useActualTheme
  system/           # usePWA, useCapabilities
  ui/               # useCommandPalette, useResizablePanel
```

### 4. Library vs. Utils Consolidation
- Delete `src/utils`.
- Move `SystemCapabilities.ts` to `src/core/system/`.
- Clean up `src/lib` into `src/core/lib`.

---

## Action Plan

### Phase 1: Engine Consolidation (Low Risk)
- **Status**: Pending.
- **Task**: Migrate `useDataLens.ts` to use the standardized `WorkerClient`.

### Phase 2: Structural Migration (Medium Risk)
- **Status**: Pending.
- **Task**: Create `src/core` and move `tip`, `workers`, and `providers` into it.

### Phase 3: Colocation (High Risk)
- **Status**: Pending.
- **Task**: Gradually move components from `src/components/features` into `src/features/<tool>/components`.

---

## User Review Required

**Questions for the USER:**
1. Do you prefer the "Layered" approach (all hooks together) or the "Feature" approach (logic near the page)?
2. Should we keep the `src/tip` engine separate, or merge it into the core worker architecture?
3. Are there any upcoming tools that would benefit from this new structure?
