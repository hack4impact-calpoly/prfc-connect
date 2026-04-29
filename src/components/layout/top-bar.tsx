"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Menu, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTopBarAction } from "@/components/layout/top-bar-action-context";
import { UserMenu } from "@/components/layout/user-menu";
import { useSidebar } from "@/components/layout/sidebar-context";

interface TopBarProps {
  userName: string;
  userRole: "Admin Manager" | "Member";
}

export function TopBar({ userName, userRole }: TopBarProps) {
  const action = useTopBarAction();
  const { toggle } = useSidebar();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-[var(--header-height)] items-center border-b border-border bg-paso-grey px-3.5">
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle sidebar"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-prfc-brown/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link href="/home" aria-label="Go to dashboard" className="shrink-0">
          <Image
            src="/assets/logo.png"
            alt="Paso Food Co-op logo"
            width={140}
            height={48}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
          {action ? (
            <Button
              type="button"
              onClick={action.onClick}
              className="h-10 bg-prfc-red px-4 text-white hover:bg-prfc-red/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{action.label}</span>
            </Button>
          ) : null}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          <UserMenu userName={userName} userRole={userRole} />
        </div>
      </div>
    </header>
  );
}
