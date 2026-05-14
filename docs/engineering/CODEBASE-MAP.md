# Codebase Map

## Current Layout
```text
src/
  app/                # Next.js routes
  components/         # UI and feature components
  hooks/              # Client orchestration hooks
  lib/                # Tool logic and utilities
  workers/            # Web workers
  python/             # Python sources + generated bundles
  config/             # Registry and product config
  types/              # Shared type definitions
```

## Target Layout
See:
- `docs/architecture/ARCHITECTURE.md`
- `docs/architecture/migration-plan.md`

## Mapping Direction
1. `components/ui` -> `shared/ui`
2. `lib` shared utils -> `shared/lib`
3. Tool-specific logic -> `modules/<tool>`
4. `workers` and `python` -> `platform/*`

