# How to Build a Rust-Based Tool (WASM)

This guide provides a detailed walkthrough for building high-performance tools using the Rust/WASM stack in Toolbase.

## 1. Initialize the Crate
Create a new folder in `rust/<your-tool>/`.

### `Cargo.toml`
```toml
[package]
name = "toolbase-your-tool"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

*Don't forget to add it to the `[workspace]` members in `rust/Cargo.toml`.*

## 2. Write the Rust Logic
### `src/lib.rs`
Always use JSON strings for the bridge to keep the interface simple and stable.

```rust
use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct Request {
    input: String,
}

#[derive(Serialize)]
struct Response {
    output: String,
}

#[wasm_bindgen]
pub fn process_json(input: &str) -> Result<String, JsValue> {
    let req: Request = serde_json::from_str(input)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let res = Response {
        output: req.input.to_uppercase(),
    };
    
    serde_json::to_string(&res)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
```

## 3. Build the WASM Module
Run:
```bash
npm run build:wasm
```
The artifacts will be generated in `public/wasm/<your-tool>/pkg/`.

## 4. Create the TypeScript Bridge
Create `src/lib/<your-tool>-rust.ts` to manage the dynamic import and module initialization.

```typescript
export async function initModule() {
  const wasmUrl = '/wasm/<your-tool>/pkg/<your_tool>_bg.wasm';
  const module = await import('../../public/wasm/<your-tool>/pkg/<your_tool>.js');
  await module.default(wasmUrl);
  return module;
}
```

## 5. Create the Worker & Hook
Put the heavy processing in a worker to avoid freezing the UI.
- Worker: `src/workers/<your-tool>.worker.ts`
- Hook: `src/hooks/use<YourTool>.ts`

## 6. UI Integration
Rust-backed tools load much faster than Python ones. You can often show a simple spinner instead of a full loading screen.

---
*Created: May 2026*
*Toolbase Engineering Cookbook*
