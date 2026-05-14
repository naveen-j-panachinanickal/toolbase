export type DataFormat = "json" | "xml" | "yaml" | "toml";
export type FormatMode = "beautify" | "minify";

export type XmlOptions = {
  preserveAttributes?: boolean;
};

export type TranspileOptions = {
  xml?: XmlOptions;
  sortKeys?: boolean;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type FormatCapabilities = {
  canConvert: boolean;
  canValidate: boolean;
  canFormat: boolean;
  canSortKeys: boolean;
  canJsonStringTools: boolean;
};

export type FormatAdapter = {
  id: DataFormat;
  capabilities: FormatCapabilities;
  parse: (input: string) => unknown;
  serialize: (data: unknown, mode: FormatMode, options?: TranspileOptions) => string;
  validate?: (input: string) => ValidationResult;
};
