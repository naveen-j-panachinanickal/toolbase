"use client";

import { useEffect, useRef, useState } from "react";
import {
  convertFormat,
  flattenJson,
  formatData,
  unflattenJson,
  validateData,
} from "@/lib/format-studio";
import type {
  FormatterRecipe,
  RecipeStep,
  RecipeStepOp,
} from "@/components/features/format-studio/types";

type UseFormatStudioFormatRecipesArgs = {
  validateFormat: "json" | "xml" | "yaml";
  validateInput: string;
  setValidateFormat: (format: "json" | "xml" | "yaml") => void;
  setValidateInput: (value: string) => void;
  reportValidationError: (message: string) => void;
};

export function useFormatStudioFormatRecipes({
  validateFormat,
  validateInput,
  setValidateFormat,
  setValidateInput,
  reportValidationError,
}: UseFormatStudioFormatRecipesArgs) {
  const [formatterRecipes, setFormatterRecipes] = useState<FormatterRecipe[]>([]);
  const [recipeNameDraft, setRecipeNameDraft] = useState("My Pipeline");
  const [recipeStepOpDraft, setRecipeStepOpDraft] = useState<RecipeStepOp>("beautify");
  const [recipeStepTargetDraft, setRecipeStepTargetDraft] = useState<"json" | "xml" | "yaml">("json");
  const [recipeStepsDraft, setRecipeStepsDraft] = useState<RecipeStep[]>([]);

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

  const runRecipePipeline = (
    startFormat: "json" | "xml" | "yaml",
    startInput: string,
    steps: RecipeStep[]
  ): { format: "json" | "xml" | "yaml"; output: string } => {
    let currentFormat: "json" | "xml" | "yaml" = startFormat;
    let current = startInput;

    for (const step of steps) {
      switch (step.op) {
        case "beautify":
          current = formatData(currentFormat, current, "beautify");
          break;
        case "minify":
          current = formatData(currentFormat, current, "minify");
          break;
        case "sortKeys":
          current = formatData(currentFormat, current, "beautify", { sortKeys: true });
          break;
        case "flatten": {
          if (currentFormat !== "json") throw new Error("Flatten works only for JSON.");
          const parsed = JSON.parse(current);
          current = JSON.stringify(flattenJson(parsed), null, 2);
          break;
        }
        case "unflatten": {
          if (currentFormat !== "json") throw new Error("Unflatten works only for JSON.");
          const parsed = JSON.parse(current) as Record<string, unknown>;
          current = JSON.stringify(unflattenJson(parsed), null, 2);
          break;
        }
        case "jsonEscape":
          if (currentFormat !== "json") throw new Error("JSON Escape works only for JSON.");
          current = JSON.stringify(current);
          break;
        case "jsonUnescape": {
          if (currentFormat !== "json") throw new Error("JSON Unescape works only for JSON.");
          const trimmed = current.trim();
          const jsonString = trimmed.startsWith("\"") && trimmed.endsWith("\"")
            ? trimmed
            : `"${trimmed.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
          current = JSON.parse(jsonString) as string;
          break;
        }
        case "convert": {
          if (!step.targetFormat) throw new Error("Convert step requires a target format.");
          current = convertFormat(currentFormat, step.targetFormat, current);
          currentFormat = step.targetFormat;
          break;
        }
      }
    }

    return { format: currentFormat, output: current };
  };

  const addRecipeStepDraft = () => {
    setRecipeStepsDraft((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        op: recipeStepOpDraft,
        targetFormat: recipeStepOpDraft === "convert" ? recipeStepTargetDraft : undefined,
      },
    ]);
  };

  const moveRecipeStep = (id: string, dir: "up" | "down") => {
    setRecipeStepsDraft((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index < 0) return prev;
      const next = [...prev];
      const swap = dir === "up" ? index - 1 : index + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  };

  const removeRecipeStep = (id: string) => {
    setRecipeStepsDraft((prev) => prev.filter((s) => s.id !== id));
  };

  const saveFormatterRecipe = () => {
    const name = recipeNameDraft.trim();
    if (!name) return;
    if (recipeStepsDraft.length === 0) return;
    setFormatterRecipes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        inputFormat: validateFormat,
        steps: recipeStepsDraft,
      },
    ]);
  };

  const loadFormatterRecipe = (id: string) => {
    const recipe = formatterRecipes.find((r) => r.id === id);
    if (!recipe) return;
    setRecipeNameDraft(recipe.name);
    setRecipeStepsDraft(recipe.steps);
    setValidateFormat(recipe.inputFormat);
  };

  const runSavedRecipe = (id: string) => {
    try {
      const recipe = formatterRecipes.find((r) => r.id === id);
      if (!recipe) return;
      const out = runRecipePipeline(validateFormat, validateInput, recipe.steps);
      setValidateFormat(out.format);
      setValidateInput(out.output);
    } catch (err: unknown) {
      reportValidationError(err instanceof Error ? err.message : "Recipe run failed");
    }
  };

  const runDraftRecipe = () => {
    try {
      const out = runRecipePipeline(validateFormat, validateInput, recipeStepsDraft);
      setValidateFormat(out.format);
      setValidateInput(out.output);
    } catch (err: unknown) {
      reportValidationError(err instanceof Error ? err.message : "Recipe run failed");
    }
  };


  useEffect(() => {
    try {
      const rawRecipes = localStorage.getItem("FormatStudio:formatter-recipes");
      if (rawRecipes) {
        const parsed = JSON.parse(rawRecipes) as Array<
          Partial<FormatterRecipe> & { format?: "json" | "xml" | "yaml"; content?: string }
        >;
        const migrated = parsed
          .map((item) => {
            if (Array.isArray(item.steps) && item.inputFormat) {
              return {
                id: item.id || crypto.randomUUID(),
                name: item.name || "Unnamed Recipe",
                inputFormat: item.inputFormat,
                steps: item.steps,
              } as FormatterRecipe;
            }
            if (item.format && typeof item.content === "string") {
              return {
                id: item.id || crypto.randomUUID(),
                name: item.name || "Legacy Recipe",
                inputFormat: item.format,
                steps: [{ id: crypto.randomUUID(), op: "beautify" as const }],
              } as FormatterRecipe;
            }
            return null;
          })
          .filter(Boolean) as FormatterRecipe[];
        setFormatterRecipes(migrated);
      }
    } catch {
      // ignore malformed local data
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("FormatStudio:formatter-recipes", JSON.stringify(formatterRecipes.slice(-30)));
  }, [formatterRecipes]);



  return {
    formatterRecipes,
    recipeNameDraft,
    recipeStepOpDraft,
    recipeStepTargetDraft,
    recipeStepsDraft,
    setRecipeNameDraft,
    setRecipeStepOpDraft,
    setRecipeStepTargetDraft,
    setRecipeStepsDraft,
    saveFormatterRecipe,
    runDraftRecipe,
    addRecipeStepDraft,
    moveRecipeStep,
    removeRecipeStep,
    loadFormatterRecipe,
    runSavedRecipe,
  };
}
