"use client";

import { Sidebar } from "@/components/layout/sidebar";

export default function SumanPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-[8vw] bg-prfc-brown flex items-center px-6">
        <span className="text-white font-bold text-xl">Top Bar Placeholder</span>
      </div>

      <Sidebar />

      <main className="ml-[220px] p-8 max-md:ml-0">
        <h1 className="text-2xl font-bold mb-4">Sidebar Preview</h1>
        <p className="text-muted-foreground">
          The sidebar is fixed on the left (hidden on mobile). Resize the browser to test responsive behavior.
        </p>
      </main>
    </div>
  );
}
