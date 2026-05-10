"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { useTransition } from "react";
import {
  CalendarDays,
  ExternalLink,
  LayoutGrid,
  MessageSquareMore,
  Settings,
  Table2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { logout } from "@/actions/auth";
import { useSidebar, SIDEBAR_WIDTH } from "@/components/layout/sidebar-context";

interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const SIDEBAR_ITEMS: SidebarNavItem[] = [
  { label: "Dashboard", href: "/home", icon: LayoutGrid },
  { label: "Groups", href: "/groups", icon: UsersRound },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Messages", href: "/messages", icon: MessageSquareMore },
];

const SIDEBAR_UTILITY: SidebarNavItem[] = [
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Settings", href: "/settings", icon: Settings },
];

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: SidebarNavItem;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        className={cn(
          "relative flex h-11 items-center gap-3 overflow-hidden rounded-md px-4 py-3 text-base transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          active
            ? "bg-paso-light-brown font-semibold text-foreground"
            : "font-normal text-muted-foreground hover:bg-prfc-brown/[0.08]",
        )}
      >
        {active ? <span className="absolute left-0 top-0 h-full w-[3px] bg-prfc-brown" aria-hidden="true" /> : null}
        <Icon className={cn("h-5 w-5 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    </li>
  );
}

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, width, mobileOpen, setMobileOpen } = useSidebar();
  const [isPending, startTransition] = useTransition();

  const closeMobile = () => setMobileOpen(false);

  const navContent = (
    <>
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 py-2">
        <ul role="list" className="flex flex-col gap-1">
          {SIDEBAR_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isItemActive(pathname, item.href)}
              collapsed={false}
              onClick={closeMobile}
            />
          ))}
          {isAdmin && (
            <NavItem
              item={{ label: "Referral Database", href: "/referral-database", icon: Table2 }}
              active={isItemActive(pathname, "/referral-database")}
              collapsed={false}
              onClick={closeMobile}
            />
          )}
        </ul>
      </nav>

      <div className="px-2 py-2">
        <ul role="list" className="flex flex-col gap-1">
          {SIDEBAR_UTILITY.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isItemActive(pathname, item.href)}
              collapsed={false}
              onClick={closeMobile}
            />
          ))}
        </ul>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            closeMobile();
            startTransition(() => logout());
          }}
          className="mt-2 flex h-11 w-full items-center gap-3 overflow-hidden rounded-md px-4 py-3 text-base text-muted-foreground hover:bg-prfc-brown/[0.08]"
        >
          <ExternalLink className="h-5 w-5 shrink-0" />
          <span>{isPending ? "Redirecting..." : "Back to Portal"}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside
        style={{ width }}
        className="fixed left-0 top-[var(--header-height)] z-30 hidden h-[calc(100vh-var(--header-height))] border-r border-border bg-paso-grey transition-[width] duration-200 ease-in-out md:flex md:flex-col"
      >
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 py-2">
          <ul role="list" className="flex flex-col gap-1">
            {SIDEBAR_ITEMS.map((item) => (
              <NavItem key={item.href} item={item} active={isItemActive(pathname, item.href)} collapsed={collapsed} />
            ))}
            {isAdmin && (
              <NavItem
                item={{ label: "Referral Database", href: "/referral-database", icon: Table2 }}
                active={isItemActive(pathname, "/referral-database")}
                collapsed={collapsed}
              />
            )}
          </ul>
        </nav>

        <div className="px-2 py-2">
          <ul role="list" className="flex flex-col gap-1">
            {SIDEBAR_UTILITY.map((item) => (
              <NavItem key={item.href} item={item} active={isItemActive(pathname, item.href)} collapsed={collapsed} />
            ))}
          </ul>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => logout())}
            title={collapsed ? "Back to Portal" : undefined}
            className="mt-2 flex h-11 w-full items-center gap-3 overflow-hidden rounded-md px-4 py-3 text-base text-muted-foreground hover:bg-prfc-brown/[0.08]"
          >
            <ExternalLink className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{isPending ? "Redirecting..." : "Back to Portal"}</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            style={{ width: SIDEBAR_WIDTH }}
            className="fixed left-0 top-[var(--header-height)] z-50 flex h-[calc(100vh-var(--header-height))] flex-col border-r border-border bg-paso-grey md:hidden"
          >
            <div className="flex items-center justify-end px-2 pt-2">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close sidebar"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-prfc-brown/[0.08]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
