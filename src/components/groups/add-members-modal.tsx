"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getAvatarColor, getInitials } from "@/utils/avatar";

export interface MemberRow {
  memberId: number;
  ownername: string;
  isOwner: boolean;
  isSelected: boolean;
}

export interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  members: MemberRow[];
  onSelectionChange: (memberId: number, selected: boolean) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function AddMembersModal({
  open,
  onOpenChange,
  groupName,
  members,
  onSelectionChange,
  onConfirm,
  isSubmitting = false,
}: AddMembersModalProps) {
  const currentMemberCount = members.filter((member) => member.isOwner || member.isSelected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-4xl font-bold text-black">{groupName}</DialogTitle>
          <DialogDescription className="text-3xl text-black">members ({currentMemberCount})</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-prfc-dark-brown" />
          <Input placeholder="Search or add members" className="h-12 rounded-lg border-prfc-border pr-10 text-xl" />
        </div>

        <div className="max-h-[400px] overflow-y-auto rounded-lg bg-paso-grey p-2">
          <div className="space-y-1">
            {members.map((member) => (
              <div key={member.memberId} className="flex items-center justify-between rounded-md px-3 py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback style={{ backgroundColor: getAvatarColor(member.ownername), color: "#fff" }}>
                      {getInitials(member.ownername)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-2xl text-black">{member.ownername}</span>
                </div>
                <Checkbox
                  checked={member.isSelected}
                  onCheckedChange={(checked) => onSelectionChange(member.memberId, checked === true)}
                  aria-label={`Select ${member.ownername}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={onConfirm} disabled={isSubmitting} className="bg-prfc-brown px-8">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
