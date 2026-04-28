"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UsersRound, ChevronRight, ChevronDown } from "lucide-react";
import { coopFormatTimed } from "@/utils/time";
import { getInitials, getAvatarColor } from "@/utils/avatar";

export interface ViewMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: {
    id: number;
    subject: string;
    body: string;
    sentAt: Date;
    groupNames: string[];
    isBlast: boolean;
  };
  recipients: Array<{
    memberId: number;
    memberName: string;
    status: "sent" | "pending" | "failed";
    photoUrl?: string | null;
  }>;
}

function formatTimestamp(date: Date): string {
  return coopFormatTimed(date, "M/d/yyyy h:mm:ss a zzz");
}

const MAX_VISIBLE_AVATARS = 6;

export function ViewMessageModal({ open, onOpenChange, message, recipients }: ViewMessageModalProps) {
  const [expanded, setExpanded] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) setExpanded(false);
    onOpenChange(next);
  };

  const groupLabel = message.isBlast
    ? "All Members"
    : message.groupNames.length > 0
      ? message.groupNames.join(", ")
      : "Unknown Group";
  const visibleAvatars = recipients.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = recipients.length - MAX_VISIBLE_AVATARS;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg font-khula !leading-none">
        <DialogHeader>
          <DialogTitle className="font-angkor text-3xl font-normal">View Message</DialogTitle>
          <DialogDescription className="sr-only">View details for this sent message.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p>To: {groupLabel}</p>
            <p>Delivered: {formatTimestamp(message.sentAt)}</p>
          </div>

          {/* Avatar row — collapsed */}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-2 w-full text-left"
            aria-expanded={expanded}
          >
            <UsersRound className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex items-center -space-x-2">
              {visibleAvatars.map((r) => (
                <Avatar key={r.memberId} className="h-8 w-8 border-2 border-background">
                  {r.photoUrl && <AvatarImage src={r.photoUrl} alt={r.memberName} />}
                  <AvatarFallback
                    style={{ backgroundColor: getAvatarColor(r.memberName) }}
                    className="text-xs font-semibold text-white"
                  >
                    {getInitials(r.memberName)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {overflowCount > 0 && (
                <div className="h-8 w-8 rounded-full bg-blue-100 border-2 border-background flex items-center justify-center text-xs font-semibold text-prfc-blue">
                  +{overflowCount}
                </div>
              )}
            </div>
            <span className="ml-auto">
              {expanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </span>
          </button>

          {/* Expanded members table */}
          {expanded && (
            <div className="rounded-lg border bg-background p-4">
              <div className="flex justify-between px-2 pb-2 font-semibold text-sm">
                <span>Members</span>
                <span>Status</span>
              </div>
              <ul className="flex flex-col gap-3 overflow-y-auto max-h-[220px] pr-1">
                {recipients.map((r) => (
                  <li key={r.memberId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        {r.photoUrl && <AvatarImage src={r.photoUrl} alt={r.memberName} />}
                        <AvatarFallback
                          style={{ backgroundColor: getAvatarColor(r.memberName) }}
                          className="text-xs font-semibold text-white"
                        >
                          {getInitials(r.memberName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{r.memberName}</span>
                    </div>
                    {r.status === "sent" ? (
                      <span className="text-xs border border-green-500 text-green-600 rounded-full px-3 py-0.5">
                        Received
                      </span>
                    ) : (
                      <span className="text-xs border border-orange-400 text-orange-500 rounded-full px-3 py-0.5">
                        Pending
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Message body */}
          <div className="rounded-lg bg-gray-100 p-4 min-h-[120px]">
            <p className="text-sm">{message.body}</p>
          </div>
        </div>

        <div className="flex justify-end">
          <DialogClose asChild>
            <Button className="bg-prfc-brown hover:bg-prfc-dark-brown text-white font-semibold px-6 rounded-md">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
