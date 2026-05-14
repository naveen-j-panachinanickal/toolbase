/**
 * TIP Public API — Barrel Export
 *
 * Everything a tool implementer or UI component needs, re-exported from
 * a single import path: `import { ... } from '@/tip'`
 *
 * Tool implementers typically need:
 *   TIPTool, TIPBundle, TIPConfig, TIPHooks, TIPContentType,
 *   createBundle, createPayload, TIPError
 *
 * Engine / hook code additionally needs:
 *   executeTIPPipeline, TIPPipelineStep, TIPEngineHooks,
 *   TIPToolRegistry
 *
 * UI / validator code additionally needs:
 *   validateBundle, validateConfig, validatePipelineSteps,
 *   registerTransformer, canTransform
 */

export * from './version';
export * from './protocol';
export * from './bundle';
export * from './errors';
export * from './registry';
export * from './engine';
export * from './transformers';
export * from './validators';
