"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default function SumanPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar
        userName="Saurish Suman"
        userRole="Admin Manager"
        actionLabel="New Group"
        onActionClick={() => alert("Action clicked")}
      />

      <Sidebar />

      <main className="min-h-[calc(100vh-var(--header-height))] p-8 md:pl-[calc(220px+2rem)]">
        <h1 className="text-2xl font-bold mb-4">Top Bar + Sidebar Preview</h1>
        <p className="text-muted-foreground">
          Top bar spans full width. Sidebar is fixed on the left below it (hidden on mobile).
        </p>
      </main>
    </div>
  );
}
