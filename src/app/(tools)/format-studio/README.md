# FormatStudio

FormatStudio is a browser-only data utility for converting, validating, and documenting structured data. It is designed for privacy: all parsing and transformation runs locally in your browser.

## What It Does

- Convert: transform between JSON, XML, YAML, and TOML.
- Validators & Formatters: validate syntax, beautify/minify, sort keys, apply presets, and save recipes.
- Diff Lab: compare left/right payloads and inspect path-level changes.
- Generator Hub: generate Markdown docs, schema summary, graph view, and OpenAPI snippet.

## Convert

Supported formats:
- Input: `json`, `xml`, `yaml`, `toml`
- Output: `json`, `xml`, `yaml`, `toml`

Notes:
- XML attributes are represented using the `@_` prefix (from `fast-xml-parser`). This makes XML round-trips possible but the JSON shape may look slightly “annotated”.
- Conversions are “structure preserving” where possible, but some conversions are inherently lossy (for example, XML does not have a native array/object distinction the same way JSON does).

## Validators & Formatters

Auto-detect:
- The tool attempts to identify the input as JSON, then XML, then YAML.
- The detected type is displayed as a pill next to the Valid/Invalid status.

Actions:
- Beautify: pretty-prints the detected format.
- Minify: compacts JSON (other formats use their standard serializer).
- Sort Keys: sorts object keys (best for JSON/YAML). Useful for stable diffs and reviews.
- Presets: `Clean Payload`, `Normalize Keys`, and `API Ready`.
- Recipes: save and reload formatter recipes in local storage.
- Pipeline recipes: build step-by-step pipelines (beautify/minify/sort/flatten/convert), then replay them.
- Fixtures: add validator fixtures, import/export fixture packs (`.json`), and run local pass/fail checks.

Validation:
- JSON: parses JSON and reports syntax errors.
- XML: checks for well-formed XML (XSD validation is not supported in the current in-browser implementation).
- YAML: parses YAML and reports syntax errors.
- Issue cards: grouped by severity with line/column/path hints and fix suggestions.

## Diff Lab

- Supports JSON, XML, YAML diffing by converting to object graphs first.
- Reports path-level changes: `added`, `removed`, `changed`, `type`.
- Helps verify transformation impact before export or downstream ingestion.

## Generator Hub (Auto-Documentation)

Auto-Documentation:
- Use JSON/XML/YAML input to generate:
  - Markdown documentation
  - Schema summary
  - OpenAPI 3 snippet
  - Interactive graph/tree
- Export bundle downloads the generated docs/snippets locally.
- Round-trip check validates fidelity across format conversion cycles.

## Related Tool

Mock data generation (flat fields + constraints, and advanced blueprint-driven generation) lives in the separate OBN tool:
- `DataBuilder` (`/tools/data-builder`)

## Tech Notes

This tool is client-side only:
- Next.js UI with Monaco editor for editing and highlighting.
- Parsing/serialization libraries: `yaml`, `@iarna/toml`, `fast-xml-parser`.
- JSON Schema enforcement is not currently exposed in the FormatStudio UI (syntax validation is).
