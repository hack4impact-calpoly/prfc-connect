"use client";

import Image from "next/image";
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
  UserRound,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";

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

function NavItem({ item, active }: { item: SidebarNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex items-center gap-3 overflow-hidden rounded-md px-4 py-3 text-base transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          active
            ? "bg-paso-light-brown font-semibold text-foreground"
            : "font-normal text-muted-foreground hover:bg-prfc-brown/[0.08]",
        )}
      >
        {active ? <span className="absolute left-0 top-0 h-full w-[3px] bg-prfc-brown" aria-hidden="true" /> : null}
        <Icon className={cn("h-5 w-5 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <aside
      className={cn("fixed left-0 top-0 z-30 hidden h-screen w-[220px] bg-paso-grey md:flex md:flex-col", className)}
    >
      <div className="flex h-[var(--header-height)] shrink-0 items-center px-5">
        <Link href="/home" aria-label="Go to dashboard">
          <Image
            src="/assets/logo.png"
            alt="Paso Food Co-op logo"
            width={140}
            height={48}
            priority
            className="h-12 w-auto"
          />
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 py-2">
        <ul role="list" className="flex flex-col gap-1">
          {SIDEBAR_ITEMS.map((item) => (
            <NavItem key={item.href} item={item} active={isItemActive(pathname, item.href)} />
          ))}
        </ul>
      </nav>

      <div className="px-2 py-2">
        <ul role="list" className="flex flex-col gap-1">
          {SIDEBAR_UTILITY.map((item) => (
            <NavItem key={item.href} item={item} active={isItemActive(pathname, item.href)} />
          ))}
        </ul>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => logout())}
          className="mt-2 flex w-full items-center gap-3 rounded-md px-4 py-3 text-base text-muted-foreground hover:bg-prfc-brown/[0.08]"
        >
          <ExternalLink className="h-5 w-5 shrink-0" />
          <span>{isPending ? "Redirecting..." : "Back to Portal"}</span>
        </button>
      </div>
    </aside>
  );
}
