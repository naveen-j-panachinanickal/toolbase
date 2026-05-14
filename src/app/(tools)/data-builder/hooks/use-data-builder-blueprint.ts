import { useState } from "react";
import { generate } from "@/lib/data-builder";

const DEFAULT_BLUEPRINT = `{
  "kind": "branch",
  "properties": {
    "id": { "kind": "leaf", "dataType": "uuid" },
    "name": { "kind": "leaf", "dataType": "string", "constraints": { "minLength": 4, "maxLength": 12 } },
    "age": { "kind": "leaf", "dataType": "number", "constraints": { "min": 18, "max": 67, "precision": 0 } },
    "email": { "kind": "leaf", "dataType": "string", "constraints": { "pattern": "^[a-z]+\\\\.[a-z]+@gmail\\\\.com$" } },
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
}`;

export function useDataBuilderBlueprint() {
  const [blueprintInput, setBlueprintInput] = useState(DEFAULT_BLUEPRINT);
  const [blueprintCount, setBlueprintCount] = useState(5);
  const [blueprintWithMeta, setBlueprintWithMeta] = useState(false);
  const [blueprintOutput, setBlueprintOutput] = useState("");

  const handleGenerateBlueprint = () => {
    try {
      const blueprint = JSON.parse(blueprintInput);
      const records = generate(blueprint, blueprintCount, { includeMeta: blueprintWithMeta });
      setBlueprintOutput(JSON.stringify(records, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      setBlueprintOutput("Invalid blueprint: " + message);
    }
  };

  return {
    blueprintInput,
    setBlueprintInput,
    blueprintCount,
    setBlueprintCount,
    blueprintWithMeta,
    setBlueprintWithMeta,
    blueprintOutput,
    handleGenerateBlueprint,
  };
}
