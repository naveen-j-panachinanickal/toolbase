# Development Workflow

## Prerequisites
1. Node.js compatible with project lockfile and Next.js version.
2. npm installed.

## Local Setup
```bash
npm install
npm run dev
```

`npm run dev` runs:
1. Next.js dev server
2. Python bundle watcher
3. Rust WASM watcher (when `rust/*` crates exist)

## Rust Workspace Notes
1. Rust crates live under the shared workspace root at `rust/`.
2. Generated Cargo build output is standardized into `rust/target/`.
3. Browser WASM artifacts are generated into `public/wasm/<tool>/pkg/`.
4. Neither `rust/target/` nor `public/wasm/**/pkg/` should be treated as source code.

## Required Checks Before PR
```bash
npm run lint
npm run type-check
```

Optional full build check:
```bash
npm run build
```

Strict Rust/WASM artifact check:
```bash
npm run build:strict-wasm
```

## Working Rules
1. Keep route pages thin; move logic into module/shared layers.
2. Avoid cross-tool coupling.
3. Preserve local-first processing behavior.
4. Do not introduce server dependency for existing browser-local paths.

## Change Management
1. Update docs when architecture or behavior changes.
2. Use ADRs for structural decisions.
3. Keep registry metadata accurate and current.
