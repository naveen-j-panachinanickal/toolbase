import { useState } from "react";
import { generateMockRows, mockRowsToOutput } from "@/lib/data-builder";
import type { MockField, MockFieldType } from "@/lib/data-builder";

export const MOCK_FIELD_TYPES: MockFieldType[] = [
  "name",
  "uuid",
  "email",
  "date",
  "int",
  "float",
  "boolean",
  "string",
];

export const POPULAR_EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "hotmail.com",
  "proton.me",
  "aol.com",
  "zoho.com",
  "zohomail.com",
  "mail.com",
];

export function useDataBuilderFields() {
  const [fields, setFields] = useState<MockField[]>([
    { id: "field-1", name: "id", type: "uuid" },
    { id: "field-2", name: "name", type: "name" },
    { id: "field-3", name: "email", type: "email" },
  ]);
  const [rowCount, setRowCount] = useState(25);
  const [mockFormat, setMockFormat] = useState<"json" | "xml">("json");
  const [mockOutput, setMockOutput] = useState("");

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { id: `field-${prev.length + 1}`, name: `field_${prev.length + 1}`, type: "string" },
    ]);
  };

  const updateField = (id: string, patch: Partial<MockField>) => {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
  };

  const handleGenerateMock = () => {
    const rows = generateMockRows(fields, rowCount);
    setMockOutput(mockRowsToOutput(rows, mockFormat));
  };

  return {
    fields,
    rowCount,
    setRowCount,
    mockFormat,
    setMockFormat,
    mockOutput,
    addField,
    updateField,
    removeField,
    handleGenerateMock,
  };
}
