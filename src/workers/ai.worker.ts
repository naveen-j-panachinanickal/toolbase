import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

/**
 * AI Worker
 * 
 * Handles local LLM inference using WebGPU via @mlc.ai/web-llm.
 * Runs in a separate thread to prevent blocking the main UI.
 */

let handler: WebWorkerMLCEngineHandler;

try {
    handler = new WebWorkerMLCEngineHandler();
    
    // Set up message listener
    self.onmessage = (msg: MessageEvent) => {
        handler.onmessage(msg);
    };
    
    console.log("[AI Worker] Initialized");
} catch (error) {
    console.error("[AI Worker] Failed to initialize handler:", error);
}
