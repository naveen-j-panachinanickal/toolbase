export type RecipeStepOp =
  | "beautify"
  | "minify"
  | "sortKeys"
  | "flatten"
  | "unflatten"
  | "jsonEscape"
  | "jsonUnescape"
  | "convert";

export type RecipeStep = {
  id: string;
  op: RecipeStepOp;
  targetFormat?: "json" | "xml" | "yaml";
};

export type FormatterRecipe = {
  id: string;
  name: string;
  inputFormat: "json" | "xml" | "yaml";
  steps: RecipeStep[];
};

export type OmniFixture = {
  id: string;
  name: string;
  format: "json" | "xml" | "yaml";
  input: string;
  expectedValid: boolean;
};

export type ValidationIssue = {
  severity: "critical" | "warning" | "info";
  message: string;
  line: number | null;
  column: number | null;
  path: string | null;
  suggestion: string;
};
