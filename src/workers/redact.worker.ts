import type { RedactRequest, RedactResponse } from "@/types/redact";

type RedactSecretsRustApi = {
  default: (wasmUrl?: string | URL | Request) => Promise<unknown>;
  redact_json: (requestJson: string) => string;
};

let rustApiPromise: Promise<RedactSecretsRustApi> | null = null;
let currentEngineLabel: "Rust WASM" | "Unavailable" = "Unavailable";

async function initRustApi(): Promise<RedactSecretsRustApi> {
  if (!rustApiPromise) {
    rustApiPromise = (async () => {
      const base = self.location?.origin ?? "";
      const jsUrl = `${base}/wasm/redact-secrets/pkg/redact_secrets.js`;
      const wasmUrl = `${base}/wasm/redact-secrets/pkg/redact_secrets_bg.wasm`;
      const mod = (await import(/* webpackIgnore: true */ jsUrl)) as RedactSecretsRustApi;
      await mod.default(wasmUrl);
      currentEngineLabel = "Rust WASM";
      return mod;
    })();
  }
  return rustApiPromise;
}

self.onmessage = async (event: MessageEvent) => {
  const { type, action, data, id } = event.data;

  if (type !== "EXECUTE" || action !== "redact") return;

  try {
    const api = await initRustApi();
    const result = JSON.parse(api.redact_json(JSON.stringify(data as RedactRequest))) as RedactResponse;
    self.postMessage({ type: "RESULT", data: { ...result, result: result.maskedContent }, id, engine: currentEngineLabel });
  } catch (error: unknown) {
    self.postMessage({
      type: "ERROR",
      error: error instanceof Error ? error.message : "Rust redaction engine failed",
      id,
      engine: "Unavailable",
    });
  }
};

// Removed top-level initialization to prevent background loading on the home page.
/*
initRustApi()
  .then(() => self.postMessage({ type: "READY", engine: currentEngineLabel }))
  .catch((error: unknown) => {
    currentEngineLabel = "Unavailable";
    self.postMessage({
      type: "READY",
      engine: currentEngineLabel,
      warning: error instanceof Error ? error.message : "Rust engine initialization failed",
    });
  });
*/
