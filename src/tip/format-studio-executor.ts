import { TIPBundle, TIPHooks, TIPConfig, TIPPayload, TIPContentType } from './protocol';
import { createBundle, createPayload } from './bundle';
import { TIPError } from './errors';
import { 
  formatData, 
  cleanPayload, 
  normalizeObjectKeys, 
  parseToObject,
  DataFormat 
} from '@/lib/format-studio';

export type FormatStudioOp = 'beautify' | 'minify' | 'clean' | 'normalize';

export function createFormatStudioTipExecutor(op: FormatStudioOp) {
  return async (input: TIPBundle, config: TIPConfig, hooks: TIPHooks): Promise<TIPBundle> => {
    hooks.onProgress(0, `Initializing Format Studio ${op}...`);

    if (input.payloads.length === 0) {
      throw new TIPError('EMPTY_BUNDLE', 'No data to process');
    }

    const format = (config.format as DataFormat) || 'json';

    const processedPayloads = await Promise.all(
      input.payloads.map(async (payload: TIPPayload, i: number) => {
        hooks.onProgress(
          Math.round((i / input.payloads.length) * 100),
          `Processing ${payload.meta.filename}...`
        );

        if (hooks.signal.aborted) throw new TIPError('CANCELLED', 'Operation cancelled');

        const text = await payload.data.text();
        let result: string;

        try {
          if (op === 'beautify' || op === 'minify') {
             result = formatData(format, text, op === 'beautify' ? 'beautify' : 'minify');
          } else {
             // For clean/normalize, we need to parse first
             const parsed = parseToObject(format, text);
             let modified: unknown;
             
             if (op === 'clean') {
               modified = cleanPayload(parsed);
             } else {
               modified = normalizeObjectKeys(parsed);
             }
             
             // After modification, beautify the result
             result = formatData(format, JSON.stringify(modified), 'beautify');
          }
        } catch (err: any) {
          throw new TIPError('EXECUTION_FAILED', `Failed to ${op} ${payload.meta.filename}: ${err.message}`);
        }

        const outContentType: TIPContentType = (op === 'clean' || op === 'normalize') ? 'application/json' : 'text/plain';
        const blob = new Blob([result], { type: outContentType });
        
        return createPayload(blob, outContentType, payload.meta.filename);
      })
    );

    hooks.onProgress(100, 'Done');
    return createBundle(processedPayloads, processedPayloads[0]?.contentType || input.contentType);
  };
}
