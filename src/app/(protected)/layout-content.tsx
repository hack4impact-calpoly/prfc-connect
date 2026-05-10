"use client";

import { useSidebar } from "@/components/layout/sidebar-context";
import { useIsMobile } from "@/hooks/use-mobile";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { width } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <main
      style={{ paddingLeft: isMobile ? undefined : width + 32 }}
      className="flex h-dvh flex-col overflow-y-auto p-8 pt-[calc(var(--header-height)+2rem)] transition-[padding-left] duration-200 ease-in-out"
    >
      {children}
    </main>
  );
}
