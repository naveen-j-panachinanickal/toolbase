import type { TIPPayload, TIPBundle, TIPHooks, TIPContentType } from './protocol';
import { createBundle, createPayload } from './bundle';
import { TIPError } from './errors';

import type { WorkerClient } from '@/workers/client';

type OutputTypeResolver = (inputPayload: TIPPayload, config: Record<string, any>) => TIPContentType;
type PayloadFormatter = (buffer: Uint8Array, config: Record<string, any>) => Record<string, any>;
type BatchPayloadFormatter = (buffers: Uint8Array[], config: Record<string, any>) => Record<string, any>;

/**
 * Parses the raw worker return payload into an array of Uint8Arrays.
 * Supports 1:1 tools (returns 1 item) and 1:N tools (returns multiple items).
 */
function extractWorkerResultBytes(result: unknown, toolNameForLogs: string, filename: string): Uint8Array[] {
  // If result is already a Uint8Array, it's a single file response
  if (result instanceof Uint8Array) return [result];
  
  // If result has a 'data' (split), 'images' (pdf-to-images), or 'result' (base64) property
  if (result && typeof result === 'object') {
    const d = (result as any).images || (result as any).data || (result as any).result;
    
    // If it's an array of sub-arrays (1-to-N response)
    if (Array.isArray(d) && (d[0] instanceof Uint8Array || Array.isArray(d[0]))) {
      return d.map(item => item instanceof Uint8Array ? item : new Uint8Array(item));
    }
    
    // If it's a single array representing one file
    if (d instanceof Uint8Array) return [d];
    if (Array.isArray(d)) return [new Uint8Array(d as number[])];
  }
  
  // Try raw array
  if (Array.isArray(result)) {
    // If it's an array of sub-arrays or Uint8Arrays (1-to-N response)
    if (result.length > 0 && (result[0] instanceof Uint8Array || Array.isArray(result[0]))) {
      return result.map(item => item instanceof Uint8Array ? item : new Uint8Array(item));
    }
    // Otherwise it's a single file represented as an array of numbers
    return [new Uint8Array(result as number[])];
  }
  
  throw new TIPError('EXECUTION_FAILED', `${toolNameForLogs} failed for ${filename}`);
}

/**
 * Creates a generic TIP executor wrapper around a WorkerClient.
 * This runs the worker action ONCE PER PAYLOAD in the bundle.
 */
export function createPerPayloadTIPExecutor(
  workerClient: WorkerClient,
  actionName: string,
  payloadFormatter: PayloadFormatter,
  outputTypeResolver: OutputTypeResolver,
  toolNameForLogs: string
) {
  return async (input: TIPBundle, config: Record<string, any>, hooks: TIPHooks) => {
    hooks.onProgress(0, `Starting ${toolNameForLogs}...`);

    if (input.payloads.length === 0) {
      throw new TIPError('EMPTY_BUNDLE', 'No data to process');
    }

    const results = await Promise.all(
      input.payloads.map(async (payload: TIPPayload, i: number) => {
        hooks.onProgress(
          Math.round((i / input.payloads.length) * 90),
          `Processing item ${i + 1} of ${input.payloads.length}...`
        );

        if (hooks.signal.aborted) throw new TIPError('CANCELLED', 'Cancelled during processing');

        const buffer = await payload.data.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        
        let result: unknown;
        try {
          const formattedKwargs = payloadFormatter(uint8, config);
          // Pass the underlying ArrayBuffer as a transferable to avoid blocking the main thread during structured clone
          result = await workerClient.execute(actionName, formattedKwargs, [buffer]);
          if (hooks.signal.aborted) throw new TIPError('CANCELLED', 'Cancelled after worker execution');
        } catch (err: any) {
           throw new TIPError('EXECUTION_FAILED', `Runtime error in ${actionName}: ${err.message || String(err)}`);
        }

        const outFormat = outputTypeResolver(payload, config);
        
        const stringPayload = typeof result === 'string' ? result : (result && typeof result === 'object' && typeof (result as any).result === 'string' ? (result as any).result : null);
        
        if (stringPayload !== null) {
          const blob = new Blob([stringPayload], { type: outFormat });
          let outName = payload.meta.filename;
          if (outFormat === 'image/png') outName = outName.replace(/\.(jpe?g|webp|gif)$/i, '') + '.png';
          if (outFormat === 'text/plain') outName = outName + '.txt';
          return [createPayload(blob, outFormat as TIPContentType, outName)];
        }

        const outBytesArray = extractWorkerResultBytes(result, toolNameForLogs, payload.meta.filename);
        
        return outBytesArray.map((bytes, idx) => {
          const blob = new Blob([bytes.buffer as ArrayBuffer], { type: outFormat });
          let baseName = payload.meta.filename.replace(/\.[^/.]+$/, "");
          
          let suffix = '';
          if (outBytesArray.length > 1) {
            suffix = `-page-${idx + 1}`;
          }

          let ext = '';
          if (outFormat === 'image/png') ext = '.png';
          else if (outFormat === 'image/jpeg') ext = '.jpg';
          else if (outFormat === 'image/webp') ext = '.webp';
          else if (outFormat === 'application/pdf') ext = '.pdf';
          else if (outFormat === 'text/plain') ext = '.txt';
          else if (outFormat === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ext = '.docx';
          else if (outFormat === 'text/html') ext = '.html';
          else ext = payload.meta.filename.match(/\.[^/.]+$/)?.[0] || '';

          return createPayload(blob, outFormat as TIPContentType, `${baseName}${suffix}${ext}`);
        });
      })
    );

    hooks.onProgress(100, 'Done');
    const flatResults = results.flat();
    return createBundle(flatResults, flatResults[0]?.contentType || input.contentType);
  };
}

/**
 * Creates a generic TIP executor wrapper that passes ALL payloads
 * into the worker simultaneously (e.g. for Merge PDF).
 */
export function createBatchTIPExecutor(
  workerClient: WorkerClient,
  actionName: string,
  payloadFormatter: BatchPayloadFormatter,
  outputTypeResolver: (config: Record<string, any>) => TIPContentType,
  toolNameForLogs: string,
  outputFilename: string = 'output'
) {
  return async (input: TIPBundle, config: Record<string, any>, hooks: TIPHooks) => {
    hooks.onProgress(0, `Starting ${toolNameForLogs}...`);

    if (input.payloads.length === 0) {
      throw new TIPError('EMPTY_BUNDLE', 'No data to process');
    }

    if (hooks.signal.aborted) throw new TIPError('CANCELLED', 'Cancelled during processing');

    hooks.onProgress(20, `Reading ${input.payloads.length} files...`);

    const buffers = await Promise.all(
      input.payloads.map(async (p) => new Uint8Array(await p.data.arrayBuffer()))
    );

    let result: unknown;
    try {
      hooks.onProgress(50, `Executing batch operation...`);
      const formattedKwargs = payloadFormatter(buffers, config);
      // Extract the underlying ArrayBuffers from our Uint8Arrays to transfer them
      const transferables = buffers.map(b => b.buffer as ArrayBuffer);
      result = await workerClient.execute(actionName, formattedKwargs, transferables);
      if (hooks.signal.aborted) throw new TIPError('CANCELLED', 'Cancelled after worker execution');
    } catch (err: any) {
       throw new TIPError('EXECUTION_FAILED', `Runtime error in ${actionName}: ${err.message || String(err)}`);
    }

    const outFormat = outputTypeResolver(config);
    let blob: Blob;
    if (typeof result === 'string') {
      blob = new Blob([result], { type: outFormat });
    } else {
      const outBytesArray = extractWorkerResultBytes(result, toolNameForLogs, outputFilename);
      blob = new Blob([outBytesArray[0].buffer as ArrayBuffer], { type: outFormat });
    }

    let outName = outputFilename;
    if (outFormat === 'application/pdf' && !outName.endsWith('.pdf')) outName += '.pdf';

    hooks.onProgress(100, 'Done');
    return createBundle([createPayload(blob, outFormat as TIPContentType, outName)], outFormat);
  };
}
