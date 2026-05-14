"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  magicPdfWorker,
  pixelsWorker,
  dataLensWorker,
  openDrawWorker,
  redactSecretsWorker,
  base64Worker
} from "@/workers/instances";

/**
 * WorkerPrewarmer — Smart intent-based worker initialization.
 * 
 * Instead of loading 50MB of WASM runtimes on the home page (killing TBT),
 * we detect when a user navigates into a specific tool category and start 
 * the boot sequence immediately. 
 * 
 * This hides the 2-3s load time while the user is still looking at the 
 * sidebar or uploading their first file.
 */
export function WorkerPrewarmer() {
  const pathname = usePathname();

  useEffect(() => {
    // PDF Tools
    if (pathname.includes("/magic-pdf")) {
      magicPdfWorker.init().catch(() => {});
    } 
    // Image Tools
    else if (pathname.includes("/pixels")) {
      pixelsWorker.init().catch(() => {});
    } 
    // Data/SQL Tools
    else if (pathname.includes("/data-lens")) {
      dataLensWorker.init().catch(() => {});
    } 
    // Graph/Diagram Tools
    else if (pathname.includes("/open-draw")) {
      openDrawWorker.init().catch(() => {});
    }
    // Security Tools
    else if (pathname.includes("/redact-secrets")) {
      redactSecretsWorker.init().catch(() => {});
    }
    // Encoding Tools
    else if (pathname.includes("/base64")) {
      base64Worker.init().catch(() => {});
    }
  }, [pathname]);

  return null; // Purely logical component
}
