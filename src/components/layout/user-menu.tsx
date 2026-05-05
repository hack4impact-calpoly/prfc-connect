"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Settings, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/utils/avatar";
import { logout } from "@/actions/auth";

interface UserMenuProps {
  userName: string;
  userRole: "Admin Manager" | "Member";
  photoUrl?: string | null;
}

export function UserMenu({ userName, userRole, photoUrl }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();
  const initials = getInitials(userName);
  const avatarColor = getAvatarColor(userName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group inline-flex items-center gap-2 rounded-md px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          id="user-menu-trigger"
          aria-label="User menu"
        >
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-tight text-foreground">{userName}</p>
            <p className="truncate text-sm text-muted-foreground">{userRole}</p>
          </div>
          <Avatar className="h-10 w-10">
            {photoUrl && <AvatarImage src={photoUrl} alt={userName} />}
            <AvatarFallback className={cn("text-sm font-semibold text-white")} style={{ backgroundColor: avatarColor }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown
            className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isPending}
          onSelect={(e) => {
            e.preventDefault();
            startTransition(() => {
              logout();
            });
          }}
        >
          <ExternalLink />
          {isPending ? "Redirecting…" : "Back to Portal"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
