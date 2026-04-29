"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, LayoutGrid, MessageSquareMore, Settings, UsersRound } from "lucide-react";
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
  { label: "Dashboard", href: "/home", icon: LayoutGrid },
  { label: "Messages", href: "/messages", icon: MessageSquareMore },
  { label: "Groups", href: "/groups", icon: UsersRound },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
];

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-[var(--header-height)] z-20 hidden h-[calc(100vh-var(--header-height))] w-[220px] bg-paso-grey md:block",
        "border-r border-border",
        className,
      )}
    >
      <nav aria-label="Main navigation" className="px-2 py-4">
        <ul role="list" className="flex flex-col gap-1">
          {SIDEBAR_ITEMS.map((item) => {
            const active = isItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 overflow-hidden rounded-md px-4 py-3 text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? "bg-paso-light-brown font-semibold text-foreground"
                      : "font-normal text-muted-foreground hover:bg-prfc-brown/[0.08]",
                  )}
                >
                  {active ? (
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-prfc-brown" aria-hidden="true" />
                  ) : null}
                  <Icon
                    className={cn("h-[18px] w-[18px] shrink-0", active ? "text-foreground" : "text-muted-foreground")}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
