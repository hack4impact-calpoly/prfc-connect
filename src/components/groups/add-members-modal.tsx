"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { getAvatarColor, getInitials } from "@/utils/avatar";

export interface MemberRow {
  memberId: number;
  ownername: string;
  photoUrl?: string | null;
  isOwner: boolean;
  isSelected: boolean;
}

export interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: MemberRow[];
  onSelectionChange: (memberId: number, selected: boolean) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function AddMembersModal({
  open,
  onOpenChange,
  members,
  onSelectionChange,
  onConfirm,
  isSubmitting = false,
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const orderedMembers = useMemo(() => [...members].sort((a, b) => Number(b.isOwner) - Number(a.isOwner)), [members]);
  const filteredMembers = useFuzzySearch(orderedMembers, { keys: ["ownername"] }, searchQuery);

  const nonOwnerFiltered = useMemo(() => filteredMembers.filter((m) => !m.isOwner), [filteredMembers]);
  const allNonOwnerSelected = nonOwnerFiltered.length > 0 && nonOwnerFiltered.every((m) => m.isSelected);

  const handleSelectAll = () => {
    for (const m of nonOwnerFiltered) {
      onSelectionChange(m.memberId, !allNonOwnerSelected);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setSearchQuery("");
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Add members</DialogTitle>
        <DialogDescription className="sr-only">Search and select members to add to this group.</DialogDescription>

        <div className="rounded-lg border border-prfc-border/30">
          <div className="border-b border-prfc-border/30 px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or select members"
                className="border-none pl-9 shadow-none focus-visible:ring-0"
                aria-label="Search members"
                aria-controls="add-member-list"
              />
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Members</span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-foreground underline hover:text-prfc-brown"
              >
                {allNonOwnerSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div
              id="add-member-list"
              className="mt-2 max-h-[min(280px,40vh)] overflow-y-auto pr-1"
              style={{ scrollbarGutter: "stable" }}
            >
              {filteredMembers.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No members found.</p>
              ) : (
                <div className="space-y-1">
                  {filteredMembers.map((member) => (
                    <label
                      key={member.memberId}
                      className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-paso-grey"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {member.photoUrl && <AvatarImage src={member.photoUrl} alt={member.ownername} />}
                          <AvatarFallback
                            style={{ backgroundColor: getAvatarColor(member.ownername) }}
                            className="text-xs font-semibold text-white"
                          >
                            {getInitials(member.ownername)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
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
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => handleOpenChange(false)} variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-prfc-brown text-white hover:bg-prfc-dark-brown"
          >
            {isSubmitting ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
