# DataBuilder

DataBuilder is OBN’s browser-only mock data generator. It helps you create realistic JSON/XML datasets for testing, demos, and prototyping without sending data to any server.

All generation runs locally in your browser.

## Two Modes

### 1) Field Builder (Flat Data)

Use this when you want rows of “table-like” data quickly.

You define:
- Field name (column key)
- Field type (string/number/date/etc.)
- Optional constraints (ranges/lengths/domains)

You get:
- An array of records (rows) in JSON or XML output

Supported field types:
- `uuid`
- `name`
- `email`
- `date`
- `int`
- `float`
- `boolean`
- `string`

Optional constraints by type:
- `int` / `float`: `min`, `max`
- `date`: `start`, `end` (date inputs)
- `string`: `minLength`, `maxLength`
- `email`: `domains` allowlist

Notes:
- Email domains can be selected from common providers and extended with custom domains.
- The Field Builder is meant for speed and simplicity (flat objects only).

### 2) Blueprint Generator (Nested Data)

Use this when you need structured, hierarchical data (objects + arrays) with deeper control.

You define a blueprint tree that can contain:
- `leaf` nodes: primitive values (string/number/boolean/date/uuid) with constraints
- `branch` nodes: objects with nested properties
- `array` nodes: repeated nodes with item counts

You get:
- `count` generated records that follow the blueprint
- Optional per-node metadata for tree-view tooling (when “Include metadata” is enabled)

### 3) Testing Studio (Schema-First)

Use this when you want deterministic, profile-based test datasets from a JSON Schema.

You define:
- JSON Schema
- `count`
- `seed` (for deterministic output)
- generation profile

Profiles:
- `happy_path`
- `edge_cases`
- `invalid_cases`
- `boundary_values`
- `security_payloads`

You get:
- Generated records aligned to schema shape
- Validation summary (`valid/invalid/error count`)
- Fixture pack workflows (export/import/run)

## Blueprint Schema

Every blueprint node has a `kind`:
- `leaf`
- `branch`
- `array`

### Leaf Node

```json
{
  "kind": "leaf",
  "dataType": "number",
  "constraints": { "min": 18, "max": 67, "precision": 0, "nullChance": 0.05 }
}
```

Supported `dataType` values:
- `string`
- `number`
- `boolean`
- `date` (ISO string)
- `uuid`

Leaf constraints:
- `number`: `min`, `max`, `precision`
- `string`: `minLength`, `maxLength`, `pattern` (regex string)
- all leaves: `nullChance` (0..1), `link` (linked logic)

### Branch Node (Object)

```json
{
  "kind": "branch",
  "properties": {
    "id": { "kind": "leaf", "dataType": "uuid" },
    "name": { "kind": "leaf", "dataType": "string" }
  }
}
```

### Array Node

```json
{
  "kind": "array",
  "constraints": { "minItems": 1, "maxItems": 3, "nullChance": 0.1 },
  "items": { "kind": "leaf", "dataType": "string" }
}
```

Array constraints:
- `minItems`, `maxItems`
- `nullChance`

## Linked Logic

Blueprint generation supports simple linking:
- Set `constraints.link` to a path in the current object context

Example: child references parent `id`:

```json
{
  "kind": "branch",
  "properties": {
    "id": { "kind": "leaf", "dataType": "uuid" },
    "children": {
      "kind": "array",
      "constraints": { "minItems": 1, "maxItems": 3 },
      "items": {
        "kind": "branch",
        "properties": {
          "parentId": { "kind": "leaf", "dataType": "uuid", "constraints": { "link": "id" } },
          "name": { "kind": "leaf", "dataType": "string" }
        }
      }
    }
  }
}
```

How it works:
- Branch properties are generated in order.
- A child can link to an earlier-generated sibling field in its parent branch.

## Metadata Output (Tree-View Friendly)

If “Include metadata” is enabled:
- Each generated node is wrapped as `{ "value": ..., "_meta": { ... } }`
- `_meta` comes from the optional `meta` property in your blueprint nodes

This is intended for future/advanced UI use-cases such as highlighting or explaining generated values.

## Output Formats

Field Builder:
- JSON: array of objects
- XML: `<items><item>...</item></items>`

Blueprint Generator:
- JSON output (stringified in the UI)

Testing Studio:
- Dataset: JSON
- Fixture pack: JSON
- Run report: JSON

## Implementation Notes

Core logic lives in:
- `src/lib/data-builder.ts`

UI lives in:
- `src/app/(tools)/data-builder/page.tsx`
