import {
  DataFormat,
  FormatMode,
  TranspileOptions,
  parseToObject,
  serializeFromObject,
  sortObjectKeysDeep,
} from "./shared";

export function formatData(
  format: DataFormat,
  input: string,
  mode: FormatMode,
  options?: TranspileOptions
): string {
  const parsed = parseToObject(format, input);
  const transformed = options?.sortKeys ? sortObjectKeysDeep(parsed) : parsed;
  return serializeFromObject(format, transformed, options, mode);
}
