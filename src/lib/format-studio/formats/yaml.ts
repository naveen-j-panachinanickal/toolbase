import YAML from "yaml";
import type { FormatAdapter } from "./types";

export const yamlAdapter: FormatAdapter = {
  id: "yaml",
  capabilities: {
    canConvert: true,
    canValidate: true,
    canFormat: true,
    canSortKeys: true,
    canJsonStringTools: false,
  },
  parse(input: string): unknown {
    return YAML.parse(input);
  },
  serialize(data): string {
    return YAML.stringify(data);
  },
  validate(input) {
    if (!input.trim()) return { valid: false, errors: ["Input is empty."], warnings: [] };
    try {
      const parsed = YAML.parse(input);
      // Strict mode: A document should generally be a mapping or a sequence in this tool's context
      if (parsed !== null && typeof parsed !== "object") {
        return {
          valid: false,
          errors: ["Invalid YAML: Input is a plain scalar value, but a structured document (object/array) is expected."],
          warnings: [],
        };
      }
      return { valid: true, errors: [], warnings: [] };
    } catch (error: unknown) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : "YAML validation failed"],
        warnings: [],
      };
    }
  },
};
