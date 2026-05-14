import { useState } from "react";
import {
  exportFixturePack,
  generateFromJsonSchema,
  importFixturePack,
  runFixtureSuite,
  validateDatasetAgainstSchema,
  type GenerationProfile,
  type JsonSchemaNode,
  type SchemaValidationSummary,
} from "@/lib/data-builder";

const DEFAULT_SCHEMA = `{
  "type": "object",
  "required": ["id", "email", "age"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 18, "maximum": 65 },
    "isActive": { "type": "boolean" },
    "tags": {
      "type": "array",
      "minItems": 1,
      "maxItems": 3,
      "items": { "type": "string", "minLength": 3, "maxLength": 8 }
    }
  }
}`;

const downloadText = (filename: string, body: string, mime = "text/plain") => {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export function useDataBuilderTesting() {
  const [schemaInput, setSchemaInput] = useState(DEFAULT_SCHEMA);
  const [schemaCount, setSchemaCount] = useState(100);
  const [schemaSeed, setSchemaSeed] = useState(4242);
  const [schemaProfile, setSchemaProfile] = useState<GenerationProfile>("happy_path");
  const [schemaOutput, setSchemaOutput] = useState("");
  const [schemaValidation, setSchemaValidation] = useState<SchemaValidationSummary | null>(null);
  const [fixturePackText, setFixturePackText] = useState("");
  const [fixtureRunOutput, setFixtureRunOutput] = useState("");

  const handleGenerateSchemaData = () => {
    try {
      const schema = JSON.parse(schemaInput) as JsonSchemaNode;
      const records = generateFromJsonSchema(schema, {
        count: schemaCount,
        seed: schemaSeed,
        profile: schemaProfile,
      });
      setSchemaOutput(JSON.stringify(records, null, 2));
      setSchemaValidation(validateDatasetAgainstSchema(records, schema));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      setSchemaOutput(`Schema generation failed: ${message}`);
      setSchemaValidation(null);
    }
  };

  const handleExportFixturePack = () => {
    try {
      const schema = JSON.parse(schemaInput) as JsonSchemaNode;
      const records = JSON.parse(schemaOutput) as Record<string, unknown>[];
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error("Generate records before exporting fixture pack.");
      }
      const pack = exportFixturePack({
        suite: "data-builder-suite",
        seed: schemaSeed,
        profile: schemaProfile,
        schema,
        cases: records.slice(0, 50).map((input, i) => ({
          name: `case_${i + 1}`,
          input,
          expectedValid: schemaProfile !== "invalid_cases",
        })),
      });
      setFixturePackText(pack);
      downloadText("data-builder-fixture-pack.json", pack, "application/json");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      setFixtureRunOutput(`Fixture export failed: ${message}`);
    }
  };

  const handleImportFixturePack = () => {
    try {
      const pack = importFixturePack(fixturePackText);
      setFixturePackText(JSON.stringify(pack, null, 2));
      setFixtureRunOutput(`Imported suite "${pack.suite}" with ${pack.cases.length} case(s).`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      setFixtureRunOutput(`Fixture import failed: ${message}`);
    }
  };

  const handleRunFixturePack = () => {
    try {
      const schema = JSON.parse(schemaInput) as JsonSchemaNode;
      const pack = importFixturePack(fixturePackText);
      const report = runFixtureSuite(pack, schema);
      setFixtureRunOutput(JSON.stringify(report, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      setFixtureRunOutput(`Fixture run failed: ${message}`);
    }
  };

  return {
    schemaInput,
    setSchemaInput,
    schemaCount,
    setSchemaCount,
    schemaSeed,
    setSchemaSeed,
    schemaProfile,
    setSchemaProfile,
    schemaOutput,
    schemaValidation,
    fixturePackText,
    setFixturePackText,
    fixtureRunOutput,
    handleGenerateSchemaData,
    handleExportFixturePack,
    handleImportFixturePack,
    handleRunFixturePack,
  };
}
