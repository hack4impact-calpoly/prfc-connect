"use client";

import { useState, useTransition } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fetchRecentActivity, markNotificationsAsSeen } from "@/actions/notifications";

interface ActivityDisplay {
  type: string;
  title: string;
  timestamp: string;
}

interface NotificationDropdownProps {
  initialUnseenCount?: number;
  lastSeenAt?: string | null;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationDropdown({ initialUnseenCount = 0, lastSeenAt = null }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ActivityDisplay[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [unseenCount, setUnseenCount] = useState(initialUnseenCount);
  const [seenCutoff, setSeenCutoff] = useState<string | null>(lastSeenAt);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      if (unseenCount > 0) {
        markNotificationsAsSeen();
        setSeenCutoff(new Date().toISOString());
        setUnseenCount(0);
      }
      if (!loaded) {
        startTransition(async () => {
          const result = await fetchRecentActivity();
          if (result.success && result.data) {
            setItems(
              result.data.map((item) => ({
                type: item.type,
                title: item.title,
                timestamp: typeof item.timestamp === "string" ? item.timestamp : new Date(item.timestamp).toISOString(),
              })),
            );
          }
          setLoaded(true);
        });
      }
    }
  };

  const isUnseen = (timestamp: string): boolean => {
    if (!seenCutoff) return true;
    return new Date(timestamp).getTime() > new Date(seenCutoff).getTime();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-prfc-brown/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Notifications"
        >
          <Bell className="h-6 w-6" />
          {unseenCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-prfc-red px-1 text-[10px] font-medium text-white">
              {unseenCount > 99 ? "99+" : unseenCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent activity</p>
          ) : (
            items.map((item, i) => {
              const unseen = isUnseen(item.timestamp);
              return (
                <div
                  key={i}
                  className={cn("flex items-start gap-3 border-b px-4 py-3 last:border-b-0", unseen && "bg-paso-grey")}
                >
                  {unseen ? (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-prfc-red" />
                  ) : (
                    <div className="mt-1.5 h-2 w-2 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", unseen ? "font-medium" : "text-muted-foreground")}>{item.title}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(item.timestamp)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
