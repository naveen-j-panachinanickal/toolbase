import * as TOML from "@iarna/toml";
import type { FormatAdapter } from "./types";

export const tomlAdapter: FormatAdapter = {
  id: "toml",
  capabilities: {
    canConvert: true,
    canValidate: false,
    canFormat: true,
    canSortKeys: true,
    canJsonStringTools: false,
  },
  parse(input: string): unknown {
    return TOML.parse(input);
  },
  serialize(data): string {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("TOML output requires a top-level object.");
    }
    return TOML.stringify(data as unknown as TOML.JsonMap);
  },
};
