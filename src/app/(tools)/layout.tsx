
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ToolMobileGuard } from "@/components/ui/ToolMobileGuard";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ErrorBoundary>
        <ToolMobileGuard>
          <main>{children}</main>
        </ToolMobileGuard>
      </ErrorBoundary>
    </>
  );
}
