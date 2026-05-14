import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = process.cwd();
const RUST_DIR = path.join(ROOT, "rust");
const PUBLIC_WASM_DIR = path.join(ROOT, "public", "wasm");

function hasWasmPack() {
  const res = spawnSync("wasm-pack", ["--version"], { stdio: "pipe" });
  return res.status === 0;
}

function getRustToolDirs() {
  if (!fs.existsSync(RUST_DIR)) return [];
  return fs
    .readdirSync(RUST_DIR)
    .map((name) => path.join(RUST_DIR, name))
    .filter((full) => fs.statSync(full).isDirectory())
    .filter((full) => fs.existsSync(path.join(full, "Cargo.toml")))
    .sort();
}

function cleanupToolArtifacts(tools) {
  for (const crateDir of tools) {
    const localTargetDir = path.join(crateDir, "target");
    const localLockfile = path.join(crateDir, "Cargo.lock");

    if (fs.existsSync(localTargetDir)) {
      fs.rmSync(localTargetDir, { recursive: true, force: true });
    }

    if (fs.existsSync(localLockfile)) {
      fs.rmSync(localLockfile, { force: true });
    }
  }
}

function run() {
  const tools = getRustToolDirs();
  if (tools.length === 0) {
    console.log("[wasm] No Rust tool crates found under ./rust");
    return 0;
  }

  if (!hasWasmPack()) {
    console.warn("[wasm] wasm-pack not found. Skipping Rust WASM build.");
    console.warn("[wasm] Install: cargo install wasm-pack");
    return 0;
  }

  fs.mkdirSync(PUBLIC_WASM_DIR, { recursive: true });
  const sharedEnv = {
    ...process.env,
    CARGO_TARGET_DIR: path.join(RUST_DIR, "target"),
  };

  const args = process.argv.slice(2);
  const isDev = args.includes("--dev") || process.env.NODE_ENV === "development";

  for (const crateDir of tools) {
    const tool = path.basename(crateDir);
    const outDir = path.join("..", "..", "public", "wasm", tool, "pkg");
    console.log(`[wasm] Building ${tool} (dev: ${isDev})...`);
    
    const wasmPackArgs = ["build", crateDir, "--target", "web", "--out-dir", outDir];
    if (isDev) {
      wasmPackArgs.push("--dev");
    }

    let res = spawnSync(
      "wasm-pack",
      wasmPackArgs,
      { stdio: "inherit", env: sharedEnv }
    );
    if (res.status !== 0) {
      console.warn(`[wasm] Standard build failed for ${tool}; retrying with --no-opt.`);
      res = spawnSync(
        "wasm-pack",
        ["build", crateDir, "--target", "web", "--out-dir", outDir, "--no-opt"],
        { stdio: "inherit", env: sharedEnv }
      );
    }
    if (res.status !== 0) {
      console.error(`[wasm] Build failed for ${tool}`);
      return res.status ?? 1;
    }
  }

  cleanupToolArtifacts(tools);

  console.log(`[wasm] Built ${tools.length} crate(s) successfully.`);
  return 0;
}

process.exit(run());
