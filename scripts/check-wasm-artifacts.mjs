import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const required = [
  path.join(ROOT, "public", "wasm", "archive-kit", "pkg", "archive_kit.js"),
  path.join(ROOT, "public", "wasm", "archive-kit", "pkg", "archive_kit_bg.wasm"),
];

const missing = required.filter((file) => !fs.existsSync(file));

if (missing.length > 0) {
  console.error("[wasm-check] Missing required WASM artifacts:");
  for (const file of missing) console.error(` - ${path.relative(ROOT, file)}`);
  console.error("[wasm-check] Run `npm run build:wasm` before production build.");
  process.exit(1);
}

console.log("[wasm-check] Archive Kit WASM artifacts present.");

