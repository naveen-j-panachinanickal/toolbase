/**
 * TIPError — Standard error shapes for the Toolbase Interoperability Protocol.
 *
 * Every error thrown by TIP code should be a TIPError so the engine can
 * distinguish protocol-level failures from unexpected runtime crashes.
 * The `code` field is machine-readable; use it to drive UI messaging.
 */

export type TIPErrorCode =
  | 'TYPE_MISMATCH'     // tool cannot consume the bundle's contentType
  | 'CONFIG_INVALID'    // required config field missing or out of range
  | 'EXECUTION_FAILED'  // tool's invoke() threw
  | 'CANCELLED'         // AbortSignal was triggered
  | 'TOOL_NOT_FOUND'    // pipeline references unknown tool ID
  | 'EMPTY_BUNDLE'      // bundle has zero payloads
  | 'COERCION_FAILED'   // type transformer failed
  | 'PIPELINE_INVALID'; // pipeline definition is malformed

export class TIPError extends Error {
  constructor(
    public readonly code: TIPErrorCode,
    message: string,
    /** Zero-based index of the pipeline step that failed (if applicable) */
    public readonly stepIndex?: number,
    /** ID of the TIPTool that failed (if applicable) */
    public readonly toolId?: string,
  ) {
    super(message);
    this.name = 'TIPError';
    // Maintain proper prototype chain for `instanceof` checks
    Object.setPrototypeOf(this, TIPError.prototype);
  }
}
