"use client";

import { useMemo, useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const currentMemberCount = members.filter((member) => member.isOwner || member.isSelected).length;
  const orderedMembers = useMemo(() => [...members].sort((a, b) => Number(b.isOwner) - Number(a.isOwner)), [members]);
  const filteredMembers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const ownerMember = orderedMembers.find((member) => member.isOwner);
    const nonOwnerMembers = orderedMembers.filter((member) => !member.isOwner);

    const matchedNonOwners =
      normalizedQuery.length === 0
        ? nonOwnerMembers
        : nonOwnerMembers.filter((member) => member.ownername.toLowerCase().includes(normalizedQuery));

    return ownerMember ? [ownerMember, ...matchedNonOwners] : matchedNonOwners;
  }, [orderedMembers, searchQuery]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearchQuery("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-4xl font-bold text-black">{groupName}</DialogTitle>
          <DialogDescription className="text-3xl text-black">members ({currentMemberCount})</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-prfc-dark-brown" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search or add members"
            aria-label="Search members"
            className="h-12 rounded-lg border-prfc-border pr-10 text-xl"
          />
        </div>

        <div aria-live="polite" className="sr-only">
          {filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"} found
        </div>

        <div className="max-h-[min(400px,50vh)] overflow-y-auto rounded-lg bg-paso-grey p-2">
          {filteredMembers.length === 0 ? (
            <p className="py-8 text-center text-lg text-muted-foreground">
              No members found matching &ldquo;{searchQuery}&rdquo;
            </p>
          ) : (
            <div className="space-y-1" role="group" aria-label="Group members">
              {filteredMembers.map((member) => (
                <div key={member.memberId} className="flex items-center justify-between rounded-md px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback style={{ backgroundColor: getAvatarColor(member.ownername), color: "#fff" }}>
                        {getInitials(member.ownername)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-2xl text-black">
                      {member.ownername}
                      {member.isOwner ? " (owner)" : ""}
                    </span>
                  </div>
                  <Checkbox
                    checked={member.isOwner ? true : member.isSelected}
                    disabled={member.isOwner}
                    onCheckedChange={(checked) => {
                      if (member.isOwner) return;
                      onSelectionChange(member.memberId, checked === true);
                    }}
                    aria-label={
                      member.isOwner ? `${member.ownername} is the group owner` : `Select ${member.ownername}`
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={onConfirm} disabled={isSubmitting} className="bg-prfc-brown px-8">
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
