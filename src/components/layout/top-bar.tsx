"use client";

import { Bell, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTopBarAction } from "@/components/layout/top-bar-action-context";
import { UserMenu } from "@/components/layout/user-menu";

interface TopBarProps {
  userName: string;
  userRole: "Admin Manager" | "Member";
}

export function TopBar({ userName, userRole }: TopBarProps) {
  const action = useTopBarAction();

  return (
    <header className="fixed top-0 right-0 z-20 flex h-[var(--header-height)] items-center border-b border-border bg-paso-grey px-4 md:left-[220px] md:px-6">
      <div className="flex w-full items-center justify-end gap-2 md:gap-3">
        {action ? (
          <Button
            type="button"
            onClick={action.onClick}
            className="mr-auto h-10 bg-prfc-red px-4 text-white hover:bg-prfc-red/90"
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
    </header>
  );
}
