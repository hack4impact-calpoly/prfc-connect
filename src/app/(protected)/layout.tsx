import { redirect } from "next/navigation";
import { getSessionWithName } from "@/lib/dal";
import { getUnseenNotificationCount, getLastNotificationSeenAt } from "@/services/dashboard";
import { AppError } from "@/utils/errors";
import { TopBarActionProvider } from "@/components/layout/top-bar-action-context";
import { TopBarSearchProvider } from "@/components/layout/top-bar-search-context";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { TopBar } from "@/components/layout/top-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { LayoutContent } from "./layout-content";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await getSessionWithName();
  } catch (error) {
    if (error instanceof AppError && error.code === "UNAUTHORIZED") {
      redirect("/unauthorized");
    }
    throw error;
  }
  const userRole = session.isAdmin ? "Admin Manager" : "Member";
  const [unseenCount, lastSeenAt] = await Promise.all([
    getUnseenNotificationCount(session.ownerid),
    getLastNotificationSeenAt(session.ownerid),
  ]);

  return (
    <SidebarProvider>
      <TopBarActionProvider>
        <TopBarSearchProvider>
          <Sidebar />
          <TopBar
            userName={session.ownername}
            userRole={userRole}
            unseenCount={unseenCount}
            lastSeenAt={lastSeenAt?.toISOString() ?? null}
          />
          <LayoutContent>{children}</LayoutContent>
        </TopBarSearchProvider>
      </TopBarActionProvider>
    </SidebarProvider>
  );
}
