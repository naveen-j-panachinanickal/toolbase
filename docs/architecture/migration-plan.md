# Architecture Migration Plan (All Tools)

## Objective
Move to the target package structure and boundary rules without route breakage.

## Phase 1: Foundation
1. Approve architecture docs and ADR process.
2. Introduce `src/modules`, `src/shared`, and `src/platform` directories.
3. Keep existing paths working during transition.

## Phase 2: Shared Extraction
1. Move reusable UI from `src/components/ui` -> `src/shared/ui`.
2. Move shared helpers from `src/lib` -> `src/shared/lib`.
3. Keep compatibility exports until all imports are updated.

## Phase 3: Module Migration (Equal Priority)
Migrate each tool into `src/modules/<tool>`:
1. magic-pdf
2. pixel-axe
3. data-lens
4. redact-secrets
5. open-draw
6. base64
7. json-to-interface
8. ping-tester
9. speed-test
10. passwordx
11. omni-parse
12. data-forge

For each tool:
1. Move tool-specific UI, hooks, and lib into module.
2. Leave `src/app/(tools)/<tool>/page.tsx` as thin composition.
3. Preserve existing route and metadata.

## Phase 4: Platform Consolidation
1. Move `src/workers` -> `src/platform/workers`.
2. Move `src/python` -> `src/platform/python`.
3. Add stable worker contracts shared by all Python-backed tools.

## Phase 5: Enforcement
1. Add import boundary lint rules.
2. Ban cross-module direct imports.
3. Add checks in CI.

## Exit Criteria
1. All tools follow shell standard.
2. All tool pages are thin and compose module APIs.
3. No legacy imports from deprecated paths.
4. CI gates enforce boundaries and quality checks.

