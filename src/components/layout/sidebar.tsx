"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, LayoutGrid, MessageSquareMore, Settings, UsersRound } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const SIDEBAR_ITEMS: SidebarNavItem[] = [
  { label: "Home", href: "/", icon: LayoutGrid },
  { label: "Messages", href: "/messages", icon: MessageSquareMore },
  { label: "Groups", href: "/groups", icon: UsersRound },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
];
const PASO_BROWN = "#523019";

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-[8vw] z-20 h-[calc(100vh-8vw)] w-[220px] bg-white",
        "border-r border-border",
        className,
      )}
    >
      <nav className="flex flex-col gap-1 p-4">
        {SIDEBAR_ITEMS.map((item) => {
          const active = isItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 overflow-hidden rounded-md px-4 py-3 text-sm transition-colors",
                active ? "font-semibold text-foreground" : "font-normal text-muted-foreground hover:bg-muted/60",
              )}
            >
              {active ? (
                <span
                  className="absolute left-0 top-0 h-full w-[3px]"
                  style={{ backgroundColor: PASO_BROWN }}
                  aria-hidden="true"
                />
              ) : null}
              <Icon
                className={cn("h-[18px] w-[18px] shrink-0", active ? "text-foreground" : "text-muted-foreground")}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
