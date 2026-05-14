/**
 * TIP Validators
 *
 * Runtime validation helpers for bundles, configs, and pipeline definitions.
 * All functions are pure — they return validation results, never throw directly.
 *
 * Use these in:
 *  - usePipelines.ts (import validation)
 *  - usePipelineEngine.ts (pre-flight config validation)
 *  - TIP unit tests
 */

import { TIP_CONTENT_TYPES } from './protocol';
import type { TIPBundle, TIPConfig, TIPConfigSchema, TIPContentType } from './protocol';
import type { TIPPipelineStep } from './engine';
import { TIPToolRegistry } from './registry';
import { TIP_VERSION } from './version';

// ─── Validation Result ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function result(errors: string[], warnings: string[] = []): ValidationResult {
  return { valid: errors.length === 0, errors, warnings };
}

// ─── Bundle Validation ────────────────────────────────────────────────────────

/**
 * Validate that a TIPBundle is structurally correct and non-empty.
 * Does NOT validate that the bundle's contentType is accepted by any tool.
 */
export function validateBundle(bundle: unknown): ValidationResult {
  const errors: string[] = [];

  if (!bundle || typeof bundle !== 'object') {
    return result(['Bundle must be a non-null object']);
  }

  const b = bundle as Partial<TIPBundle>;

  if (!Array.isArray(b.payloads)) {
    errors.push('bundle.payloads must be an array');
  } else if (b.payloads.length === 0) {
    errors.push('bundle.payloads must not be empty (EMPTY_BUNDLE)');
  }

  if (!b.contentType || !TIP_CONTENT_TYPES.includes(b.contentType as TIPContentType)) {
    errors.push(`bundle.contentType "${b.contentType}" is not a recognised TIP content type`);
  }

  if (!b.meta || typeof b.meta !== 'object') {
    errors.push('bundle.meta must be an object');
  }

  return result(errors);
}

// ─── Config Validation ────────────────────────────────────────────────────────

/**
 * Validate a TIPConfig against a TIPConfigSchema.
 * Checks required fields, type coercibility, and numeric range constraints.
 */
export function validateConfig(
  config: TIPConfig,
  schema: TIPConfigSchema
): ValidationResult {
  const errors: string[] = [];

  for (const field of schema.fields) {
    const value = config[field.key] ?? field.default;

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`Config field "${field.key}" is required but missing`);
      continue;
    }

    if (field.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`Config field "${field.key}" must be a number, got "${value}"`);
        continue;
      }
      if (field.min !== undefined && num < field.min) {
        errors.push(
          `Config field "${field.key}" value ${num} is below minimum ${field.min}`
        );
      }
      if (field.max !== undefined && num > field.max) {
        errors.push(
          `Config field "${field.key}" value ${num} exceeds maximum ${field.max}`
        );
      }
    }

    if (field.type === 'select' && field.options) {
      const validValues = field.options.map((o) => o.value);
      if (!validValues.includes(value as string | number)) {
        errors.push(
          `Config field "${field.key}" value "${value}" is not one of: ${validValues.join(', ')}`
        );
      }
    }
  }

  return result(errors);
}

// ─── Pipeline Step Validation ─────────────────────────────────────────────────

/**
 * Validate a list of pipeline steps against the live TIPToolRegistry.
 * Checks:
 *  1. Each toolId resolves to a registered tool
 *  2. Sequential type compatibility (each tool's output → next tool's input)
 *  3. Config validity per step
 *
 * @param steps          - The steps to validate
 * @param startType      - The content type of the initial bundle
 */
export function validatePipelineSteps(
  steps: TIPPipelineStep[],
  startType: TIPContentType
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let currentType: TIPContentType = startType;

  if (steps.length === 0) {
    errors.push('Pipeline must have at least one step');
    return result(errors, warnings);
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const tool = TIPToolRegistry.get(step.toolId);

    if (!tool) {
      errors.push(`Step ${i + 1}: Tool "${step.toolId}" is not registered`);
      continue;
    }

    if (!tool.consumes.includes(currentType)) {
      errors.push(
        `Step ${i + 1}: Tool "${tool.name}" cannot consume "${currentType}". ` +
          `It accepts: ${tool.consumes.join(', ')}`
      );
    }

    const configResult = validateConfig(step.config, tool.configSchema);
    configResult.errors.forEach((e) => errors.push(`Step ${i + 1} config: ${e}`));
    configResult.warnings.forEach((w) => warnings.push(`Step ${i + 1} config: ${w}`));

    // Advance currentType to the first output type for subsequent step checks
    if (tool.produces.length > 0) {
      currentType = tool.produces[0];
    }
  }

  return result(errors, warnings);
}

// ─── TIP Version Validation ───────────────────────────────────────────────────

/**
 * Validate a saved TIP version string against the running protocol version.
 * Returns a warning (not an error) if the versions differ — pipelines built
 * against older versions may still work; the user should be informed.
 */
export function validateTipVersion(savedVersion: string | undefined): ValidationResult {
  const warnings: string[] = [];

  if (!savedVersion) {
    warnings.push('Pipeline does not specify a tipVersion — assuming it is compatible');
    return result([], warnings);
  }

  if (savedVersion !== TIP_VERSION) {
    warnings.push(
      `Pipeline was built with TIP v${savedVersion}, current version is TIP v${TIP_VERSION}. ` +
        'It may still work, but some tools or fields could have changed.'
    );
  }

  return result([], warnings);
}
