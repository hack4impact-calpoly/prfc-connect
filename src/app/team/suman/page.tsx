"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { TopBarActionProvider } from "@/components/layout/top-bar-action-context";
import { TopBarSearchProvider } from "@/components/layout/top-bar-search-context";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { LayoutContent } from "@/app/(protected)/layout-content";

export default function SumanPage() {
  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <TopBarActionProvider>
          <TopBarSearchProvider>
            <Sidebar />
            <TopBar userName="Saurish Suman" userRole="Admin Manager" />
            <LayoutContent>
              <h1 className="text-2xl font-bold mb-4">Sidebar + Toolbar Preview</h1>
              <p className="text-muted-foreground">
                Sidebar collapses to icon-only mode. Click the collapse button at the bottom.
              </p>
              <div className="mt-6 w-1/3">
                <QuickActionsCard
                  onCreateEvent={() => alert("Create Event clicked")}
                  onCreateGroup={() => alert("Create Group clicked")}
                  onSendMessage={() => alert("Send Message clicked")}
                />
              </div>
            </LayoutContent>
          </TopBarSearchProvider>
        </TopBarActionProvider>
      </SidebarProvider>
    </div>
  );
}
