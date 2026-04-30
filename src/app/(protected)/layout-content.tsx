"use client";

import { useSidebar } from "@/components/layout/sidebar-context";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { width } = useSidebar();

  return (
    <main
      style={{ paddingLeft: width + 32 }}
      className="flex h-dvh flex-col overflow-y-auto p-8 pt-[calc(var(--header-height)+2rem)] transition-[padding-left] duration-200 ease-in-out"
    >
      {children}
    </main>
  );
}
