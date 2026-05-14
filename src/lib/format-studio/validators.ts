import { getFormatAdapter } from "./formats";
import type { ValidationResult } from "./formats/types";

export type { ValidationResult } from "./formats/types";

export function validateData(format: "json" | "xml" | "yaml", input: string): ValidationResult {
  try {
    const adapter = getFormatAdapter(format);
    if (!adapter.validate) {
      return { valid: false, errors: [`Validation is not supported for ${format.toUpperCase()}.`], warnings: [] };
    }
    return adapter.validate(input);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Validation failed";
    return { valid: false, errors: [message], warnings: [] };
  }
}
