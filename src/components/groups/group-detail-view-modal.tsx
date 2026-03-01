"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor, getInitials } from "@/utils/avatar";

interface GroupDetailViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: number;
    name: string;
    description: string | null;
    members: Array<{ memberId: number; ownername: string }>;
    memberCount: number;
  };
  onEdit: () => void;
  onViewAllMembers: () => void;
}

export function GroupDetailViewModal({
  open,
  onOpenChange,
  group,
  onEdit,
  onViewAllMembers,
}: GroupDetailViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="text-prfc-brown">
          <DialogTitle className="text-4xl font-black">{group.name}</DialogTitle>
          <DialogDescription className="sr-only">View details for the {group.name} group.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 justify-items-stretch gap-4">
          <Button
            type="button"
            onClick={onEdit}
            className="justify-self-end bg-transparent border-none p-0 hover:underline hover:bg-transparent cursor-pointer shadow-none text-foreground"
          >
            Edit
          </Button>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="groupName" className="font-bold">
              Group Name
            </label>
            <Input type="text" id="groupName" defaultValue={group.name} readOnly />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="description" className="font-bold">
              Description
            </label>
            <Textarea id="description" defaultValue={group.description || ""} readOnly />
          </div>

          <div className="flex items-center gap-4">
            <span className="font-bold">Members</span>
            <Button
              type="button"
              onClick={onViewAllMembers}
              className="rounded-full h-7 px-3 bg-gray-200 hover:bg-gray-300 border-none shadow-none text-foreground text-xs"
            >
              View All
            </Button>
          </div>

          <div className="flex gap-2" role="group" aria-label="Group members">
            {group.members.slice(0, 8).map((member) => (
              <Avatar key={member.memberId} className="h-8 w-8" role="img" aria-label={member.ownername}>
                <AvatarFallback
                  style={{ backgroundColor: getAvatarColor(member.ownername) }}
                  className="text-xs font-semibold text-white"
                  aria-hidden="true"
                >
                  {getInitials(member.ownername)}
                </AvatarFallback>
              </Avatar>
            ))}
            {group.memberCount > 8 ? (
              <div
                className="bg-slate-300 h-8 w-8 rounded-full font-bold text-sm flex justify-center items-center"
                role="img"
                aria-label={`${group.memberCount - 8} more members`}
              >
                +{group.memberCount - 8}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
