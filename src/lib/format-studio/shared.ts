import { getFormatAdapter } from "./formats";
import type { DataFormat, FormatMode, TranspileOptions } from "./formats/types";

export type { DataFormat, FormatMode, XmlOptions, TranspileOptions } from "./formats/types";

export function sortObjectKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeysDeep);

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .reduce((sorted: Record<string, unknown>, key) => {
        sorted[key] = sortObjectKeysDeep(record[key]);
        return sorted;
      }, {});
  }

  return value;
}

export function parseToObject(format: DataFormat, input: string): unknown {
  if (!input.trim()) throw new Error("Input is empty.");
  return getFormatAdapter(format).parse(input);
}

export function serializeFromObject(
  format: DataFormat,
  data: unknown,
  _options?: TranspileOptions,
  mode: FormatMode = "beautify"
): string {
  return getFormatAdapter(format).serialize(data, mode, _options);
}
