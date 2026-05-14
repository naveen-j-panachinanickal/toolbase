"use client";

import { useEffect, useState } from "react";
import { diffObjects, parseToObject } from "@/lib/format-studio";

export function useFormatStudioDiff() {
  const [diffFormat, setDiffFormat] = useState<"json" | "xml" | "yaml">("json");
  const [diffLeft, setDiffLeft] = useState("{\n  \"id\": 7,\n  \"name\": \"Ava\",\n  \"meta\": { \"active\": true }\n}");
  const [diffRight, setDiffRight] = useState("{\n  \"id\": \"7\",\n  \"name\": \"Ava\",\n  \"meta\": { \"active\": false },\n  \"role\": \"admin\"\n}");
  const [diffError, setDiffError] = useState<string | null>(null);
  const [diffEntries, setDiffEntries] = useState<ReturnType<typeof diffObjects>>([]);

  const handleRunDiff = () => {
    try {
      const left = parseToObject(diffFormat, diffLeft);
      const right = parseToObject(diffFormat, diffRight);
      setDiffEntries(diffObjects(left, right));
      setDiffError(null);
    } catch (err: unknown) {
      setDiffEntries([]);
      setDiffError(err instanceof Error ? err.message : "Unable to generate diff");
    }
  };

  useEffect(() => {
    handleRunDiff();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diffFormat, diffLeft, diffRight]);

  return {
    diffFormat,
    diffLeft,
    diffRight,
    diffError,
    diffEntries,
    setDiffFormat,
    setDiffLeft,
    setDiffRight,
    handleRunDiff,
  };
}
