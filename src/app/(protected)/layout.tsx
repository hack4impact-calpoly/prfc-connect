import { getSessionWithName } from "@/lib/dal";
import { TopBarActionProvider } from "@/components/layout/top-bar-action-context";
import { TopBarSearchProvider } from "@/components/layout/top-bar-search-context";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { TopBar } from "@/components/layout/top-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { LayoutContent } from "./layout-content";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionWithName();
  const userRole = session.isAdmin ? "Admin Manager" : "Member";

  return (
    <SidebarProvider>
      <TopBarActionProvider>
        <TopBarSearchProvider>
          <Sidebar />
          <TopBar userName={session.ownername} userRole={userRole} />
          <LayoutContent>{children}</LayoutContent>
        </TopBarSearchProvider>
      </TopBarActionProvider>
    </SidebarProvider>
  );
}
