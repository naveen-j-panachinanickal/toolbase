import {
  DataFormat,
  TranspileOptions,
  parseToObject,
  serializeFromObject,
  sortObjectKeysDeep,
} from "./format-studio/shared";

export type { DataFormat, FormatMode, XmlOptions, TranspileOptions } from "./format-studio/shared";
export type { ValidationResult } from "./format-studio/validators";
export { formatData } from "./format-studio/formatters";
export { validateData } from "./format-studio/validators";
export { parseToObject } from "./format-studio/shared";
export { getFormatCapabilities } from "./format-studio/formats";

export function convertFormat(
  inputFormat: DataFormat,
  outputFormat: DataFormat,
  input: string,
  options?: TranspileOptions
): string {
  const parsed = parseToObject(inputFormat, input);
  const transformed = options?.sortKeys ? sortObjectKeysDeep(parsed) : parsed;
  return serializeFromObject(outputFormat, transformed, options, "beautify");
}

export function generateMarkdownDoc(json: unknown, rootName: string) {
  const sections: string[] = [];

  function inferType(value: unknown): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) return value.length ? `array<${inferType(value[0])}>` : "array";
    if (typeof value === "object") return "object";
    return typeof value;
  }

  function describeNode(node: unknown, path: string) {
    const title = path || rootName || "Root";
    sections.push(`## ${title}`);

    if (Array.isArray(node)) {
      if (node.length === 0) {
        sections.push("- (empty array)");
        return;
      }

      sections.push(`- (array with ${node.length} items)`);
      const sample = node.find((item) => item !== null && item !== undefined) ?? node[0];
      sections.push(`- \`item\`: ${inferType(sample)}`);

      if (sample && typeof sample === "object") {
        describeNode(sample, `${title}[]`);
      }
      return;
    }

    if (!node || typeof node !== "object") {
      sections.push("- `value`: " + inferType(node));
      return;
    }

    const record = node as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 0) {
      sections.push("- (empty object)");
      return;
    }

    keys.forEach((key) => {
      sections.push("- `" + key + "`: " + inferType(record[key]));
    });

    keys.forEach((key) => {
      const value = record[key];
      if (Array.isArray(value) && value.length > 0) {
        const sample = value.find((item) => item !== null && item !== undefined) ?? value[0];
        if (sample && typeof sample === "object") {
          describeNode(sample, `${title}.${key}[]`);
        }
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        describeNode(value, `${title}.${key}`);
      }
    });
  }

  sections.push(`# ${rootName || "Root"} Schema`);
  describeNode(json, rootName || "Root");

  return sections.join("\n");
}

export type DiffKind = "added" | "removed" | "changed" | "type";

export type DiffEntry = {
  path: string;
  kind: DiffKind;
  left: string;
  right: string;
};

function summarizeValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `array(${value.length})`;
  if (typeof value === "object") return `object(${Object.keys(value as Record<string, unknown>).length})`;
  return typeof value;
}

function diffWalk(left: unknown, right: unknown, path: string, out: DiffEntry[]) {
  const leftArray = Array.isArray(left);
  const rightArray = Array.isArray(right);
  const leftObject = !!left && typeof left === "object" && !leftArray;
  const rightObject = !!right && typeof right === "object" && !rightArray;

  if ((leftArray && rightArray) || (leftObject && rightObject)) {
    if (leftArray && rightArray) {
      const max = Math.max(left.length, right.length);
      for (let i = 0; i < max; i++) {
        const nextPath = `${path}[${i}]`;
        if (i >= left.length) {
          out.push({ path: nextPath, kind: "added", left: "—", right: summarizeValue(right[i]) });
          continue;
        }
        if (i >= right.length) {
          out.push({ path: nextPath, kind: "removed", left: summarizeValue(left[i]), right: "—" });
          continue;
        }
        diffWalk(left[i], right[i], nextPath, out);
      }
      return;
    }

    if (leftObject && rightObject) {
      const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
      for (const key of keys) {
        const hasLeft = Object.prototype.hasOwnProperty.call(left, key);
        const hasRight = Object.prototype.hasOwnProperty.call(right, key);
        const nextPath = path ? `${path}.${key}` : key;
        if (!hasLeft) {
          out.push({ path: nextPath, kind: "added", left: "—", right: summarizeValue((right as Record<string, unknown>)[key]) });
          continue;
        }
        if (!hasRight) {
          out.push({ path: nextPath, kind: "removed", left: summarizeValue((left as Record<string, unknown>)[key]), right: "—" });
          continue;
        }
        diffWalk((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key], nextPath, out);
      }
      return;
    }
  }

  const leftType = left === null ? "null" : Array.isArray(left) ? "array" : typeof left;
  const rightType = right === null ? "null" : Array.isArray(right) ? "array" : typeof right;

  if (leftType !== rightType) {
    out.push({
      path: path || "$",
      kind: "type",
      left: `${leftType} (${summarizeValue(left)})`,
      right: `${rightType} (${summarizeValue(right)})`,
    });
    return;
  }

  if (JSON.stringify(left) !== JSON.stringify(right)) {
    out.push({
      path: path || "$",
      kind: "changed",
      left: summarizeValue(left),
      right: summarizeValue(right),
    });
  }
}

export function diffObjects(left: unknown, right: unknown): DiffEntry[] {
  const out: DiffEntry[] = [];
  diffWalk(left, right, "$", out);
  return out;
}

export type SchemaShape = {
  type: string;
  children?: Record<string, SchemaShape>;
  item?: SchemaShape;
};

export function inferSchemaShape(value: unknown): SchemaShape {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    const first = value.find((v) => v !== null && v !== undefined);
    return {
      type: "array",
      item: first === undefined ? { type: "unknown" } : inferSchemaShape(first),
    };
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const children: Record<string, SchemaShape> = {};
    for (const [k, v] of Object.entries(record)) {
      children[k] = inferSchemaShape(v);
    }
    return { type: "object", children };
  }
  return { type: typeof value };
}

function shapeToMarkdownLines(shape: SchemaShape, path: string, lines: string[]) {
  if (shape.type === "object" && shape.children) {
    for (const [k, child] of Object.entries(shape.children)) {
      const nextPath = path ? `${path}.${k}` : k;
      lines.push(`- \`${nextPath}\`: ${child.type}`);
      shapeToMarkdownLines(child, nextPath, lines);
    }
    return;
  }
  if (shape.type === "array" && shape.item) {
    lines.push(`- \`${path}[]\`: ${shape.item.type}`);
    shapeToMarkdownLines(shape.item, `${path}[]`, lines);
  }
}

export function generateSchemaSummary(value: unknown, rootName: string): string {
  const shape = inferSchemaShape(value);
  const lines = [`# ${rootName || "Payload"} Schema Summary`, "", `- \`${rootName || "payload"}\`: ${shape.type}`];
  shapeToMarkdownLines(shape, rootName || "payload", lines);
  return lines.join("\n");
}

function toOpenApiSchema(shape: SchemaShape): Record<string, unknown> {
  if (shape.type === "object") {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [k, child] of Object.entries(shape.children || {})) {
      properties[k] = toOpenApiSchema(child);
      required.push(k);
    }
    return { type: "object", properties, required };
  }
  if (shape.type === "array") {
    return { type: "array", items: toOpenApiSchema(shape.item || { type: "string" }) };
  }
  if (shape.type === "null") {
    return { nullable: true };
  }
  if (shape.type === "number" || shape.type === "string" || shape.type === "boolean" || shape.type === "integer") {
    return { type: shape.type };
  }
  return { type: "string" };
}

export function generateOpenApiSnippet(value: unknown, rootName: string): string {
  const shape = inferSchemaShape(value);
  const schema = toOpenApiSchema(shape);
  const payload = {
    openapi: "3.0.0",
    info: { title: `${rootName || "Payload"} API`, version: "1.0.0" },
    paths: {
      "/ingest": {
        post: {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema,
              },
            },
          },
          responses: {
            "200": { description: "Success" },
          },
        },
      },
    },
  };
  return JSON.stringify(payload, null, 2);
}

// -------------------------
// JSON Flatten / Unflatten
// -------------------------

export type FlattenOptions = {
  separator?: string; // default "."
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function flattenJson(value: unknown, options: FlattenOptions = {}) {
  const separator = options.separator ?? ".";
  const out: Record<string, unknown> = {};

  const visit = (node: unknown, prefix: string) => {
    if (Array.isArray(node)) {
      node.forEach((item, idx) => visit(item, prefix ? `${prefix}${separator}${idx}` : String(idx)));
      return;
    }

    if (isPlainObject(node)) {
      for (const [key, child] of Object.entries(node)) {
        const next = prefix ? `${prefix}${separator}${key}` : key;
        visit(child, next);
      }
      return;
    }

    // primitives (or null)
    out[prefix || "value"] = node;
  };

  visit(value, "");
  return out;
}

export function unflattenJson(flat: Record<string, unknown>, options: FlattenOptions = {}) {
  const separator = options.separator ?? ".";
  const root: Record<string, unknown> = {};

  const isIndex = (s: string) => /^\d+$/.test(s);

  type Container = Record<string, unknown> | unknown[];

  const setPath = (obj: Record<string, unknown>, path: string[], value: unknown) => {
    let current: Container = obj;

    for (let i = 0; i < path.length; i++) {
      const part = path[i];
      const nextPart = path[i + 1];
      const isLast = i === path.length - 1;

      if (isLast) {
        if (Array.isArray(current) && isIndex(part)) {
          (current as unknown[])[Number(part)] = value;
        } else {
          (current as Record<string, unknown>)[part] = value;
        }
        return;
      }

      const shouldBeArray = nextPart !== undefined && isIndex(nextPart);
      const existing: unknown =
        Array.isArray(current) && isIndex(part)
          ? (current as unknown[])[Number(part)]
          : (current as Record<string, unknown>)[part];
      let nextContainer: Container;

      if (shouldBeArray) {
        nextContainer = Array.isArray(existing) ? existing : [];
      } else {
        nextContainer = isPlainObject(existing) ? (existing as Record<string, unknown>) : {};
      }

      if (Array.isArray(current) && isIndex(part)) {
        (current as unknown[])[Number(part)] = nextContainer;
      } else {
        (current as Record<string, unknown>)[part] = nextContainer;
      }

      current = nextContainer;
    }
  };

  for (const [key, value] of Object.entries(flat)) {
    if (!key) continue;
    const parts = key.split(separator).filter(Boolean);
    if (parts.length === 0) continue;
    setPath(root, parts, value);
  }

  return root;
}

// -------------------------
// Payload Cleanup & Normalization
// -------------------------

export function cleanPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(cleanPayload)
      .filter((v) => v !== null && v !== undefined && (typeof v !== "object" || Object.keys(v as object).length > 0));
  }

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = cleanPayload(v);
      if (cleaned !== null && cleaned !== undefined) {
        if (typeof cleaned === "object" && !Array.isArray(cleaned) && Object.keys(cleaned as object).length === 0) {
          continue;
        }
        out[k] = cleaned;
      }
    }
    return out;
  }

  return value;
}

function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
      index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    )
    .replace(/[\s\-_]+/g, "");
}

export function normalizeObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeObjectKeys);

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const newKey = toCamelCase(k);
      out[newKey] = normalizeObjectKeys(v);
    }
    return out;
  }

  return value;
}
