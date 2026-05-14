"use client";

import { useState } from "react";
import { convertFormat } from "@/lib/format-studio";
import type { DataFormat } from "@/lib/format-studio";

export function useFormatStudioConvert() {
  const [inputFormat, setInputFormat] = useState<DataFormat>("json");
  const [outputFormat, setOutputFormat] = useState<DataFormat>("yaml");
  const [inputText, setInputText] = useState("{\n  \"status\": \"ok\",\n  \"count\": 2\n}");
  const [outputText, setOutputText] = useState("");
  const [transpileError, setTranspileError] = useState<string | null>(null);

  const handleTranspile = () => {
    try {
      const result = convertFormat(inputFormat, outputFormat, inputText);
      setOutputText(result);
      setTranspileError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Conversion failed";
      setTranspileError(message);
    }
  };

  return {
    inputFormat,
    outputFormat,
    inputText,
    outputText,
    transpileError,
    setInputFormat,
    setOutputFormat,
    setInputText,
    handleTranspile,
  };
}
