"use client";

import { useEffect, useMemo, useState } from "react";
import {
  convertFormat,
  diffObjects,
  generateMarkdownDoc,
  generateOpenApiSnippet,
  generateSchemaSummary,
  parseToObject,
} from "@/lib/format-studio";

export function useFormatStudioGenerator() {
  const [docInputFormat, setDocInputFormat] = useState<"json" | "xml" | "yaml">("json");
  const [docInput, setDocInput] = useState("{\n  \"user\": {\n    \"id\": 7,\n    \"name\": \"Ava\"\n  },\n  \"active\": true\n}");
  const [docRootName, setDocRootName] = useState("Payload");
  const [docOutput, setDocOutput] = useState("");
  const [docSchemaOutput, setDocSchemaOutput] = useState("");
  const [docOpenApiOutput, setDocOpenApiOutput] = useState("");
  const [roundTripReport, setRoundTripReport] = useState("");

  const docGraph = useMemo(() => {
    try {
      return { value: parseToObject(docInputFormat, docInput) as unknown, error: null as string | null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid input";
      return { value: null as unknown, error: message };
    }
  }, [docInputFormat, docInput]);

  const [docGraphMaxDepth, setDocGraphMaxDepth] = useState(7);
  const [docGraphMaxNodes, setDocGraphMaxNodes] = useState(260);
  const [docGraphDefaultExpandDepth, setDocGraphDefaultExpandDepth] = useState(2);
  const [docGraphRestoreExpandDepth, setDocGraphRestoreExpandDepth] = useState(2);
  const [docGraphExpandedPaths, setDocGraphExpandedPaths] = useState<Set<string>>(() => new Set());
  const [isDocGraphModalOpen, setDocGraphModalOpen] = useState(false);
  const [docSearchPath, setDocSearchPath] = useState("");

  const exportTextFile = (filename: string, body: string, contentType = "text/plain") => {
    const blob = new Blob([body], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateDoc = () => {
    if (docGraph.error) {
      setDocOutput("Invalid input: " + docGraph.error);
      return;
    }
    setDocOutput(generateMarkdownDoc(docGraph.value, docRootName || "Root"));
    setDocSchemaOutput(generateSchemaSummary(docGraph.value, docRootName || "Payload"));
    setDocOpenApiOutput(generateOpenApiSnippet(docGraph.value, docRootName || "Payload"));
  };

  const handleExportBundle = () => {
    if (docGraph.error) return;
    const root = docRootName || "payload";
    exportTextFile(`${root}-doc.md`, docOutput || generateMarkdownDoc(docGraph.value, root), "text/markdown");
    exportTextFile(`${root}-schema.md`, docSchemaOutput || generateSchemaSummary(docGraph.value, root), "text/markdown");
    exportTextFile(`${root}-openapi.json`, docOpenApiOutput || generateOpenApiSnippet(docGraph.value, root), "application/json");
  };

  const handleRoundTripCheck = () => {
    try {
      const original = parseToObject(docInputFormat, docInput);
      const asJson = JSON.stringify(original, null, 2);
      const targetFormat = docInputFormat === "json" ? "yaml" : "json";
      const converted = convertFormat("json", targetFormat, asJson);
      const back = convertFormat(targetFormat, "json", converted);
      const roundTrip = JSON.parse(back);
      const changes = diffObjects(original, roundTrip);
      if (changes.length === 0) {
        setRoundTripReport(`Round-trip check passed via ${targetFormat.toUpperCase()}. No fidelity loss detected.`);
      } else {
        setRoundTripReport(`Round-trip check found ${changes.length} difference(s) via ${targetFormat.toUpperCase()}.`);
      }
    } catch (err: unknown) {
      setRoundTripReport(err instanceof Error ? err.message : "Round-trip check failed");
    }
  };

  useEffect(() => {
    if (!isDocGraphModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDocGraphModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDocGraphModalOpen]);

  return {
    docInputFormat,
    docInput,
    docRootName,
    docOutput,
    docSchemaOutput,
    docOpenApiOutput,
    roundTripReport,
    docGraph,
    docGraphMaxDepth,
    docGraphMaxNodes,
    docGraphDefaultExpandDepth,
    docGraphRestoreExpandDepth,
    docGraphExpandedPaths,
    isDocGraphModalOpen,
    docSearchPath,
    setDocInputFormat,
    setDocInput,
    setDocRootName,
    setDocSchemaOutput,
    setDocOpenApiOutput,
    setDocGraphMaxDepth,
    setDocGraphMaxNodes,
    setDocGraphDefaultExpandDepth,
    setDocGraphRestoreExpandDepth,
    setDocGraphExpandedPaths,
    setDocGraphModalOpen,
    setDocSearchPath,
    handleGenerateDoc,
    handleExportBundle,
    handleRoundTripCheck,
  };
}
