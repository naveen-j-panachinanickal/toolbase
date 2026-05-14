import { jsonAdapter } from "./json";
import { tomlAdapter } from "./toml";
import { xmlAdapter } from "./xml";
import { yamlAdapter } from "./yaml";
import type { DataFormat, FormatAdapter, FormatCapabilities } from "./types";

const ADAPTERS: Record<DataFormat, FormatAdapter> = {
  json: jsonAdapter,
  xml: xmlAdapter,
  yaml: yamlAdapter,
  toml: tomlAdapter,
};

export function getFormatAdapter(format: DataFormat): FormatAdapter {
  return ADAPTERS[format];
}

export function getFormatCapabilities(format: DataFormat): FormatCapabilities {
  return ADAPTERS[format].capabilities;
}

export const VALIDATABLE_FORMATS = ["json", "xml", "yaml"] as const;
