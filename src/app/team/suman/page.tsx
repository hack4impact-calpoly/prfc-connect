"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { TopBarActionProvider } from "@/components/layout/top-bar-action-context";
import { TopBarSearchProvider } from "@/components/layout/top-bar-search-context";

export default function SumanPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopBarActionProvider>
        <TopBarSearchProvider>
          <Sidebar />
          <TopBar userName="Saurish Suman" userRole="Admin Manager" />

          <main className="min-h-screen p-8 pt-[calc(var(--header-height)+2rem)] md:pl-[calc(220px+2rem)]">
            <h1 className="text-2xl font-bold mb-4">Sidebar + Toolbar Preview</h1>
            <p className="text-muted-foreground">
              Sidebar spans full height with logo and user menu. Toolbar sits to the right of sidebar.
            </p>

            <div className="mt-6 w-1/3">
              <QuickActionsCard
                onCreateEvent={() => alert("Create Event clicked")}
                onCreateGroup={() => alert("Create Group clicked")}
                onSendMessage={() => alert("Send Message clicked")}
              />
            </div>
          </main>
        </TopBarSearchProvider>
      </TopBarActionProvider>
    </div>
  );
}
