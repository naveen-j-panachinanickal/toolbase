import { XMLBuilder } from "fast-xml-parser";

export type DataType = "string" | "number" | "boolean" | "date" | "uuid";

export type ConstraintBase = {
  nullChance?: number; // 0..1
  link?: string; // path to another field in context, e.g. "parent.id"
};

export type StringConstraints = ConstraintBase & {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // regex string
};

export type NumberConstraints = ConstraintBase & {
  min?: number;
  max?: number;
  precision?: number; // decimal places
};

export type ArrayConstraints = ConstraintBase & {
  minItems?: number;
  maxItems?: number;
};

export type LeafNode = {
  kind: "leaf";
  dataType: DataType;
  constraints?: StringConstraints | NumberConstraints | ConstraintBase;
  meta?: Record<string, unknown>;
};

export type BranchNode = {
  kind: "branch";
  properties: Record<string, BlueprintNode>;
  meta?: Record<string, unknown>;
};

export type ArrayNode = {
  kind: "array";
  items: BlueprintNode;
  constraints?: ArrayConstraints;
  meta?: Record<string, unknown>;
};

export type BlueprintNode = LeafNode | BranchNode | ArrayNode;

export type GenerateOptions = {
  includeMeta?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function randInt(min: number, max: number) {
  if (max < min) [min, max] = [max, min];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, precision?: number) {
  if (max < min) [min, max] = [max, min];
  const value = Math.random() * (max - min) + min;
  if (typeof precision === "number" && precision >= 0) {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }
  return value;
}

function randString(minLength = 4, maxLength = 12) {
  if (maxLength < minLength) [minLength, maxLength] = [maxLength, minLength];
  const length = randInt(minLength, maxLength);
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[randInt(0, chars.length - 1)];
  }
  return out;
}

function randDateIso() {
  const now = Date.now();
  const past = now - 1000 * 60 * 60 * 24 * 365 * 5;
  return new Date(randInt(past, now)).toISOString();
}

function randUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getByPath(obj: unknown, path?: string): unknown {
  if (!path) return undefined;

  let current: unknown = obj;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function shouldNull(nullChance?: number) {
  if (nullChance === undefined) return false;
  const chance = clamp(nullChance, 0, 1);
  return Math.random() < chance;
}

function generateLeaf(node: LeafNode, ctx: unknown): unknown {
  const constraints = node.constraints || {};

  if ("link" in constraints && constraints.link) {
    const linked = getByPath(ctx, constraints.link);
    if (linked !== undefined) return linked;
  }

  if (shouldNull(constraints.nullChance)) return null;

  switch (node.dataType) {
    case "string": {
      const c = constraints as StringConstraints;
      if (c.pattern) {
        try {
          const re = new RegExp(c.pattern);
          for (let i = 0; i < 5; i++) {
            const s = randString(c.minLength ?? 4, c.maxLength ?? 12);
            if (re.test(s)) return s;
          }
        } catch {
          // ignore invalid regex and fall back
        }
      }
      return randString(c.minLength ?? 4, c.maxLength ?? 12);
    }
    case "number": {
      const c = constraints as NumberConstraints;
      return randFloat(c.min ?? 0, c.max ?? 100, c.precision);
    }
    case "boolean":
      return Math.random() > 0.5;
    case "date":
      return randDateIso();
    case "uuid":
    default:
      return randUuid();
  }
}

function withMeta(value: unknown, node: BlueprintNode, includeMeta?: boolean): unknown {
  if (!includeMeta) return value;
  return {
    value,
    _meta: node.meta || {},
  };
}

function generateNode(node: BlueprintNode, ctx: unknown, includeMeta?: boolean): unknown {
  if (node.kind === "leaf") {
    return withMeta(generateLeaf(node, ctx), node, includeMeta);
  }

  if (node.kind === "array") {
    if (shouldNull(node.constraints?.nullChance)) return withMeta(null, node, includeMeta);

    const minItems = node.constraints?.minItems ?? 1;
    const maxItems = node.constraints?.maxItems ?? Math.max(minItems, 3);
    const count = randInt(minItems, maxItems);

    const arr: unknown[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(generateNode(node.items, ctx, includeMeta));
    }
    return withMeta(arr, node, includeMeta);
  }

  const obj: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(node.properties)) {
    // Pass the partially-built object as context so siblings can link to earlier fields.
    obj[key] = generateNode(child, obj, includeMeta);
  }
  return withMeta(obj, node, includeMeta);
}

export function generate(blueprint: BlueprintNode, count: number, options: GenerateOptions = {}) {
  const safeCount = Math.max(1, Math.floor(count));
  const records: unknown[] = [];

  for (let i = 0; i < safeCount; i++) {
    records.push(generateNode(blueprint, {}, options.includeMeta));
  }

  return records;
}

// -------------------------
// Field Builder (Flat Data)
// -------------------------

export type MockFieldType = "name" | "uuid" | "email" | "date" | "int" | "float" | "boolean" | "string";

export type MockField = {
  id: string;
  name: string;
  type: MockFieldType;
  constraints?: {
    min?: number;
    max?: number;
    start?: string; // YYYY-MM-DD
    end?: string; // YYYY-MM-DD
    minLength?: number;
    maxLength?: number;
    domains?: string[];
  };
};

const firstNames = ["Ava", "Liam", "Noah", "Mia", "Evelyn", "Lucas", "Maya", "Aria", "Ezra", "Leo"];
const lastNames = ["Patel", "Nguyen", "Kim", "Garcia", "Smith", "Johnson", "Brown", "Martin", "Lopez", "Davis"];
const defaultDomains = ["example.com", "mail.com", "test.dev", "corp.local", "demo.io"];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDateFromRange(start?: string, end?: string) {
  const now = Date.now();
  const past = now - 1000 * 60 * 60 * 24 * 365 * 5;
  const startMs = start ? new Date(start).getTime() : past;
  const endMs = end ? new Date(end).getTime() : now;
  const validStart = Number.isFinite(startMs) ? startMs : past;
  const validEnd = Number.isFinite(endMs) ? endMs : now;
  return new Date(randInt(validStart, validEnd)).toISOString();
}

function mockValue(field: MockField): unknown {
  const constraints = field.constraints;

  switch (field.type) {
    case "name":
      return `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    case "uuid":
      return randUuid();
    case "email": {
      const domains = constraints?.domains && constraints.domains.length > 0 ? constraints.domains : defaultDomains;
      return `${randomItem(firstNames).toLowerCase()}.${randomItem(lastNames).toLowerCase()}@${randomItem(domains)}`;
    }
    case "date":
      return randomDateFromRange(constraints?.start, constraints?.end);
    case "int":
      return randInt(constraints?.min ?? 1, constraints?.max ?? 1000);
    case "float":
      return randFloat(constraints?.min ?? 1, constraints?.max ?? 1000, 2);
    case "boolean":
      return Math.random() > 0.5;
    case "string":
    default: {
      if (constraints?.minLength || constraints?.maxLength) {
        const minLen = Math.max(1, constraints.minLength ?? 4);
        const maxLen = Math.max(minLen, constraints.maxLength ?? minLen + 6);
        return randString(minLen, maxLen);
      }
      return `value-${randInt(100, 999)}`;
    }
  }
}

export function generateMockRows(fields: MockField[], count: number) {
  const safeCount = Math.max(1, Math.floor(count));
  const rows: Record<string, unknown>[] = [];

  for (let i = 0; i < safeCount; i++) {
    const row: Record<string, unknown> = {};
    fields.forEach((field, idx) => {
      const key = field.name || `field_${idx + 1}`;
      row[key] = mockValue(field);
    });
    rows.push(row);
  }

  return rows;
}

export function mockRowsToOutput(rows: Record<string, unknown>[], format: "json" | "xml") {
  if (format === "json") return JSON.stringify(rows, null, 2);

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    indentBy: "  ",
  });

  return builder.build({ items: { item: rows } });
}

// -------------------------------------------
// Testing-first deterministic schema generator
// -------------------------------------------

export type GenerationProfile =
  | "happy_path"
  | "edge_cases"
  | "invalid_cases"
  | "boundary_values"
  | "security_payloads";

type JsonSchemaType = "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";

export type JsonSchemaNode = {
  type?: JsonSchemaType | JsonSchemaType[];
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  items?: JsonSchemaNode;
  enum?: Array<string | number | boolean | null>;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  additionalProperties?: boolean;
};

export type SchemaGenerationOptions = {
  count: number;
  seed?: number;
  profile?: GenerationProfile;
};

export type SchemaValidationError = {
  path: string;
  rule: string;
  message: string;
};

export type SchemaValidationSummary = {
  valid: boolean;
  records: number;
  validRecords: number;
  invalidRecords: number;
  errors: SchemaValidationError[];
};

export type FixtureCase = {
  name: string;
  input: Record<string, unknown>;
  expectedValid: boolean;
};

export type FixturePack = {
  suite: string;
  version: string;
  generatorVersion: string;
  schemaFingerprint: string;
  seed: number;
  profile: GenerationProfile;
  cases: FixtureCase[];
};

class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextFloat(): number {
    // Mulberry32
    this.state += 0x6d2b79f5;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    if (max < min) [min, max] = [max, min];
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  bool(): boolean {
    return this.nextFloat() >= 0.5;
  }

  pick<T>(items: T[]): T {
    return items[this.int(0, Math.max(0, items.length - 1))];
  }
}

const securityPayloads = [
  "<script>alert('xss')</script>",
  "' OR 1=1 --",
  "../../../etc/passwd",
  "${jndi:ldap://example.com/a}",
  "{\"$ne\": null}",
];

function resolveSchemaType(schema: JsonSchemaNode): JsonSchemaType {
  const raw = schema.type;
  if (Array.isArray(raw)) {
    const preferred = raw.find((t) => t !== "null");
    return (preferred || raw[0] || "object") as JsonSchemaType;
  }
  if (raw) return raw;
  if (schema.properties) return "object";
  if (schema.items) return "array";
  if (schema.enum && schema.enum.length > 0) {
    const v = schema.enum[0];
    if (v === null) return "null";
    if (typeof v === "boolean") return "boolean";
    if (typeof v === "number") return "number";
    return "string";
  }
  return "object";
}

function seededString(rng: SeededRandom, length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[rng.int(0, chars.length - 1)];
  return out;
}

function pickLength(
  rng: SeededRandom,
  minLen: number,
  maxLen: number,
  profile: GenerationProfile
): number {
  const min = Math.max(0, minLen);
  const max = Math.max(min, maxLen);
  if (profile === "boundary_values") return rng.bool() ? min : max;
  if (profile === "edge_cases") return rng.bool() ? min : max;
  return rng.int(min, max);
}

function pickNumber(
  rng: SeededRandom,
  minNum: number,
  maxNum: number,
  profile: GenerationProfile,
  isInteger: boolean
): number {
  const min = Math.min(minNum, maxNum);
  const max = Math.max(minNum, maxNum);
  if (profile === "boundary_values" || profile === "edge_cases") {
    return rng.bool() ? min : max;
  }
  if (isInteger) return rng.int(Math.floor(min), Math.floor(max));
  return rng.nextFloat() * (max - min) + min;
}

function genStringByFormat(
  rng: SeededRandom,
  schema: JsonSchemaNode,
  profile: GenerationProfile
): string {
  if (profile === "security_payloads") return rng.pick(securityPayloads);
  if (schema.format === "email") {
    const local = seededString(rng, 6);
    return `${local}@example.test`;
  }
  if (schema.format === "uuid") {
    const hex = () => seededString(rng, 8).replace(/[g-z]/g, "a");
    return `${hex()}-${hex().slice(0, 4)}-4${hex().slice(0, 3)}-a${hex().slice(0, 3)}-${hex()}${hex().slice(0, 4)}`;
  }
  if (schema.format === "date-time") {
    const y = rng.int(2020, 2026);
    const m = String(rng.int(1, 12)).padStart(2, "0");
    const d = String(rng.int(1, 28)).padStart(2, "0");
    const h = String(rng.int(0, 23)).padStart(2, "0");
    const mm = String(rng.int(0, 59)).padStart(2, "0");
    const s = String(rng.int(0, 59)).padStart(2, "0");
    return `${y}-${m}-${d}T${h}:${mm}:${s}Z`;
  }
  if (schema.pattern) {
    // keep simple deterministic fallback if regex synthesis is not available
    const len = pickLength(rng, schema.minLength ?? 4, schema.maxLength ?? 12, profile);
    return seededString(rng, len);
  }
  const len = pickLength(rng, schema.minLength ?? 4, schema.maxLength ?? 12, profile);
  return seededString(rng, len);
}

function violateString(schema: JsonSchemaNode, value: string): string {
  if (schema.maxLength !== undefined) return value + seededString(new SeededRandom(12345), 10);
  if (schema.pattern) return "!!!invalid-pattern!!!";
  return "";
}

function violateNumber(schema: JsonSchemaNode): number {
  if (schema.maximum !== undefined) return schema.maximum + 1;
  if (schema.minimum !== undefined) return schema.minimum - 1;
  return NaN;
}

function generateFromSchemaNode(
  schema: JsonSchemaNode,
  rng: SeededRandom,
  profile: GenerationProfile,
  path = "$"
): unknown {
  const schemaType = resolveSchemaType(schema);

  if (schema.enum && schema.enum.length > 0) {
    const pick = rng.pick(schema.enum);
    if (profile === "invalid_cases") {
      if (typeof pick === "string") return `${pick}-invalid`;
      if (typeof pick === "number") return pick + 99999;
      if (typeof pick === "boolean") return !pick;
      return "invalid";
    }
    return pick;
  }

  switch (schemaType) {
    case "object": {
      const out: Record<string, unknown> = {};
      const required = schema.required || [];
      const properties = schema.properties || {};
      for (const [key, child] of Object.entries(properties)) {
        const childValue = generateFromSchemaNode(child, rng, profile, `${path}.${key}`);
        const omitRequired = profile === "invalid_cases" && required.includes(key) && rng.nextFloat() < 0.25;
        if (!omitRequired) out[key] = childValue;
      }
      return out;
    }
    case "array": {
      const itemSchema = schema.items || { type: "string" };
      const minItems = schema.minItems ?? 1;
      const maxItems = Math.max(minItems, schema.maxItems ?? Math.max(minItems, 3));
      const count =
        profile === "boundary_values" || profile === "edge_cases"
          ? (rng.bool() ? minItems : maxItems)
          : rng.int(minItems, maxItems);
      const arr = Array.from({ length: Math.max(0, count) }, (_, i) =>
        generateFromSchemaNode(itemSchema, rng, profile, `${path}[${i}]`)
      );
      if (profile === "invalid_cases" && schema.maxItems !== undefined && rng.nextFloat() < 0.2) {
        arr.push(generateFromSchemaNode(itemSchema, rng, "happy_path", `${path}[${arr.length}]`));
      }
      return arr;
    }
    case "string": {
      const value = genStringByFormat(rng, schema, profile);
      if (profile === "invalid_cases" && rng.nextFloat() < 0.2) {
        return violateString(schema, value);
      }
      return value;
    }
    case "number":
    case "integer": {
      const min = schema.minimum ?? 0;
      const max = schema.maximum ?? 1000;
      const value = pickNumber(rng, min, max, profile, schemaType === "integer");
      if (profile === "invalid_cases" && rng.nextFloat() < 0.2) {
        return violateNumber(schema);
      }
      return value;
    }
    case "boolean":
      return profile === "boundary_values" ? true : rng.bool();
    case "null":
      return null;
    default:
      return null;
  }
}

export function generateFromJsonSchema(
  schema: JsonSchemaNode,
  options: SchemaGenerationOptions
): Record<string, unknown>[] {
  const count = Math.max(1, Math.floor(options.count || 1));
  const seed = Number.isFinite(options.seed) ? Number(options.seed) : 4242;
  const profile = options.profile ?? "happy_path";
  const rng = new SeededRandom(seed);

  const records: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    const rec = generateFromSchemaNode(schema, rng, profile, `$[${i}]`);
    records.push((rec && typeof rec === "object" ? rec : { value: rec }) as Record<string, unknown>);
  }
  return records;
}

function validateValueAgainstSchema(
  value: unknown,
  schema: JsonSchemaNode,
  path: string,
  errors: SchemaValidationError[]
) {
  const schemaType = resolveSchemaType(schema);
  if (schema.enum && schema.enum.length > 0 && !schema.enum.some((v) => JSON.stringify(v) === JSON.stringify(value))) {
    errors.push({ path, rule: "enum", message: "Value not in enum." });
    return;
  }

  if (schemaType === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push({ path, rule: "type", message: "Expected object." });
      return;
    }
    const obj = value as Record<string, unknown>;
    const req = schema.required || [];
    req.forEach((key) => {
      if (!(key in obj)) errors.push({ path: `${path}.${key}`, rule: "required", message: "Missing required field." });
    });
    for (const [key, childSchema] of Object.entries(schema.properties || {})) {
      if (key in obj) validateValueAgainstSchema(obj[key], childSchema, `${path}.${key}`, errors);
    }
    return;
  }

  if (schemaType === "array") {
    if (!Array.isArray(value)) {
      errors.push({ path, rule: "type", message: "Expected array." });
      return;
    }
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push({ path, rule: "minItems", message: `Expected at least ${schema.minItems} items.` });
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push({ path, rule: "maxItems", message: `Expected at most ${schema.maxItems} items.` });
    }
    value.forEach((item, idx) => validateValueAgainstSchema(item, schema.items || { type: "string" }, `${path}[${idx}]`, errors));
    return;
  }

  if (schemaType === "string") {
    if (typeof value !== "string") {
      errors.push({ path, rule: "type", message: "Expected string." });
      return;
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({ path, rule: "minLength", message: `Length must be >= ${schema.minLength}.` });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({ path, rule: "maxLength", message: `Length must be <= ${schema.maxLength}.` });
    }
    if (schema.pattern) {
      try {
        const re = new RegExp(schema.pattern);
        if (!re.test(value)) errors.push({ path, rule: "pattern", message: "String does not match pattern." });
      } catch {
        // ignore invalid schema pattern
      }
    }
    return;
  }

  if (schemaType === "number" || schemaType === "integer") {
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push({ path, rule: "type", message: "Expected number." });
      return;
    }
    if (schemaType === "integer" && !Number.isInteger(value)) {
      errors.push({ path, rule: "integer", message: "Expected integer." });
    }
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({ path, rule: "minimum", message: `Value must be >= ${schema.minimum}.` });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({ path, rule: "maximum", message: `Value must be <= ${schema.maximum}.` });
    }
    return;
  }

  if (schemaType === "boolean" && typeof value !== "boolean") {
    errors.push({ path, rule: "type", message: "Expected boolean." });
    return;
  }
  if (schemaType === "null" && value !== null) {
    errors.push({ path, rule: "type", message: "Expected null." });
  }
}

export function validateDatasetAgainstSchema(
  records: Record<string, unknown>[],
  schema: JsonSchemaNode
): SchemaValidationSummary {
  let validRecords = 0;
  const allErrors: SchemaValidationError[] = [];
  records.forEach((record, idx) => {
    const errors: SchemaValidationError[] = [];
    validateValueAgainstSchema(record, schema, `$[${idx}]`, errors);
    if (errors.length === 0) validRecords += 1;
    allErrors.push(...errors);
  });
  return {
    valid: allErrors.length === 0,
    records: records.length,
    validRecords,
    invalidRecords: Math.max(0, records.length - validRecords),
    errors: allErrors.slice(0, 200),
  };
}

function hashString(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv32:${(h >>> 0).toString(16)}`;
}

export function exportFixturePack(input: {
  suite: string;
  seed: number;
  profile: GenerationProfile;
  schema: JsonSchemaNode;
  cases: FixtureCase[];
}): string {
  const pack: FixturePack = {
    suite: input.suite,
    version: "1.0.0",
    generatorVersion: "v1",
    schemaFingerprint: hashString(JSON.stringify(input.schema)),
    seed: input.seed,
    profile: input.profile,
    cases: input.cases,
  };
  return JSON.stringify(pack, null, 2);
}

export function importFixturePack(raw: string): FixturePack {
  const parsed = JSON.parse(raw) as Partial<FixturePack>;
  if (!parsed || !Array.isArray(parsed.cases)) {
    throw new Error("Invalid fixture pack: missing cases.");
  }
  return {
    suite: parsed.suite || "imported-suite",
    version: parsed.version || "1.0.0",
    generatorVersion: parsed.generatorVersion || "v1",
    schemaFingerprint: parsed.schemaFingerprint || "unknown",
    seed: Number(parsed.seed || 0),
    profile: (parsed.profile || "happy_path") as GenerationProfile,
    cases: parsed.cases.map((c, i) => ({
      name: c.name || `case_${i + 1}`,
      input: c.input || {},
      expectedValid: !!c.expectedValid,
    })),
  };
}

export function runFixtureSuite(
  pack: FixturePack,
  schema: JsonSchemaNode
) {
  const results = pack.cases.map((c) => {
    const summary = validateDatasetAgainstSchema([c.input], schema);
    const actualValid = summary.valid;
    const passed = actualValid === c.expectedValid;
    return {
      name: c.name,
      expectedValid: c.expectedValid,
      actualValid,
      passed,
      errors: summary.errors,
    };
  });
  return {
    suite: pack.suite,
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };
}
