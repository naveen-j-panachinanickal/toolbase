import { useMemo, useState } from "react";
import { FlaskConical, Layers3, Sparkles } from "lucide-react";
import type { ToolSidebarItem } from "@/components/ui/ToolSidebar";

export type DataBuilderSection = "fields" | "blueprint" | "testing";

export function useDataBuilderLayout() {
  const sections: ToolSidebarItem[] = useMemo(
    () => [
      { id: "fields", label: "Field Builder", icon: Layers3 },
      { id: "blueprint", label: "Blueprint Generator", icon: Sparkles },
      { id: "testing", label: "Testing Studio", icon: FlaskConical },
    ],
    []
  );

  const [activeSection, setActiveSection] = useState<DataBuilderSection>("fields");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const activeLabel = sections.find((section) => section.id === activeSection)?.label || "DataBuilder";

  return {
    sections,
    activeSection,
    setActiveSection,
    isSidebarOpen,
    setSidebarOpen,
    activeLabel,
  };
}
