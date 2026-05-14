import type { FormatAdapter } from "./types";

export const jsonAdapter: FormatAdapter = {
  id: "json",
  capabilities: {
    canConvert: true,
    canValidate: true,
    canFormat: true,
    canSortKeys: true,
    canJsonStringTools: true,
  },
  parse(input: string): unknown {
    return JSON.parse(input);
  },
  serialize(data, mode): string {
    return mode === "minify" ? JSON.stringify(data) : JSON.stringify(data, null, 2);
  },
  validate(input) {
    if (!input.trim()) return { valid: false, errors: ["Input is empty."], warnings: [] };
    try {
      JSON.parse(input);
      return { valid: true, errors: [], warnings: [] };
    } catch (error: unknown) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : "JSON validation failed"],
        warnings: [],
      };
    }
  },
};
