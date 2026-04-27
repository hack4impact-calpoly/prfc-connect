"use client";

import { useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { getAvatarColor, getInitials } from "@/utils/avatar";

interface MemberOption {
  memberId: number;
  ownername: string;
  photoUrl?: string | null;
}

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description: string | null; memberIds: number[] }) => void;
  members: MemberOption[];
  isSubmitting?: boolean;
}

export function CreateGroupModal({
  open,
  onOpenChange,
  onSubmit,
  members,
  isSubmitting = false,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const nameRef = useRef<HTMLInputElement>(null);

  const filteredMembers = useFuzzySearch(members, { keys: ["ownername"] }, searchQuery);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name is required.");
      nameRef.current?.focus();
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      memberIds: Array.from(selectedIds),
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (!nextOpen) {
      setName("");
      setDescription("");
      setError("");
      setSearchQuery("");
      setSelectedIds(new Set());
    }
    onOpenChange(nextOpen);
  };

  const toggleMember = (memberId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredMembers.map((m) => m.memberId);
    const allSelected = allFilteredIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of allFilteredIds) next.delete(id);
      } else {
        for (const id of allFilteredIds) next.add(id);
      }
      return next;
    });
  };

  const allFilteredSelected = filteredMembers.length > 0 && filteredMembers.every((m) => selectedIds.has(m.memberId));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-angkor text-2xl font-normal">Create a new group</DialogTitle>
            <DialogDescription className="sr-only">
              Fill in the details below to create a new contact group.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <Input
                ref={nameRef}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Group Name"
                aria-required="true"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "group-name-error" : undefined}
              />
              {error && (
                <p id="group-name-error" className="mt-1 text-sm text-prfc-red">
                  {error}
                </p>
              )}
            </div>

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description..."
              rows={3}
            />

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
                    aria-controls="member-list"
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
                    {allFilteredSelected ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div
                  id="member-list"
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
                            <span className="text-sm">{member.ownername}</span>
                          </div>
                          <Checkbox
                            checked={selectedIds.has(member.memberId)}
                            onCheckedChange={() => toggleMember(member.memberId)}
                            aria-label={`Select ${member.ownername}`}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" onClick={() => handleOpenChange(false)} variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="bg-prfc-brown text-white hover:bg-prfc-dark-brown"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
