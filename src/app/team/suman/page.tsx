"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { TopBarActionProvider } from "@/components/layout/top-bar-action-context";

export default function SumanPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopBarActionProvider>
        <TopBar userName="Saurish Suman" userRole="Admin Manager" />

        <Sidebar />

        <main className="min-h-[calc(100vh-var(--header-height))] p-8 md:pl-[calc(220px+2rem)]">
          <h1 className="text-2xl font-bold mb-4">Top Bar + Sidebar Preview</h1>
          <p className="text-muted-foreground">
            Top bar spans full width. Sidebar is fixed on the left below it (hidden on mobile).
          </p>

          <div className="mt-6 w-1/3">
            <QuickActionsCard
              onCreateEvent={() => alert("Create Event clicked")}
              onCreateGroup={() => alert("Create Group clicked")}
              onSendMessage={() => alert("Send Message clicked")}
            />
          </div>
        </main>
      </TopBarActionProvider>
    </div>
  );
}
