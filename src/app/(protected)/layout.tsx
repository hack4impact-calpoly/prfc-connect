import { getSessionWithName } from "@/lib/dal";
import { TopBarActionProvider } from "@/components/layout/top-bar-action-context";
import { TopBarSearchProvider } from "@/components/layout/top-bar-search-context";
import { TopBar } from "@/components/layout/top-bar";
import { Sidebar } from "@/components/layout/sidebar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionWithName();
  const userRole = session.isAdmin ? "Admin Manager" : "Member";

  return (
    <TopBarActionProvider>
      <TopBarSearchProvider>
        <Sidebar />
        <TopBar userName={session.ownername} userRole={userRole} />
        <main className="min-h-screen p-8 pt-[calc(var(--header-height)+2rem)] md:pl-[calc(220px+2rem)]">
          {children}
        </main>
      </TopBarSearchProvider>
    </TopBarActionProvider>
  );
}
