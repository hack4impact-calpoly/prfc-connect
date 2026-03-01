"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown, Plus, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/utils/avatar";

interface TopBarProps {
  userName: string;
  userRole: "Admin Manager" | "Member";
  actionLabel?: string;
  onActionClick?: () => void;
}

export function TopBar({ userName, userRole, actionLabel, onActionClick }: TopBarProps) {
  const initials = getInitials(userName);
  const avatarColor = getAvatarColor(userName);

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] w-full items-center border-b border-border bg-background px-4 md:px-6">
      <div className="flex w-full items-center gap-3 md:gap-4">
        <Link href="/" className="shrink-0 md:w-[220px]" aria-label="Go to home">
          <Image
            src="/assets/logo.png"
            alt="Paso Food Co-op logo"
            width={140}
            height={48}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input type="text" placeholder="Search" className="h-10 bg-white pl-10" aria-label="Search" />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
            {actionLabel ? (
              <Button
                type="button"
                onClick={onActionClick}
                className="h-10 bg-paso-accent-black px-4 text-white hover:bg-paso-accent-black/90"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{actionLabel}</span>
              </Button>
            ) : null}

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="User menu"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback
                  className={cn("text-sm font-semibold text-white")}
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-foreground">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">{userRole}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
