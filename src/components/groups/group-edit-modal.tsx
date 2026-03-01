"use client";

import { useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor, getInitials } from "@/utils/avatar";

interface GroupEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: number;
    name: string;
    description: string | null;
    members: Array<{ memberId: number; ownername: string }>;
    memberCount: number;
  };
  onSave: (data: { name: string; description: string | null }) => void;
  onDelete: () => void;
  onAddMembers: () => void;
  isSubmitting?: boolean;
}

export function GroupEditModal({
  open,
  onOpenChange,
  group,
  onSave,
  onDelete,
  onAddMembers,
  isSubmitting = false,
}: GroupEditModalProps) {
  const [newName, setNewName] = useState(group.name);
  const [newDescription, setNewDescription] = useState(group.description ?? "");
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (nextOpen) {
      setNewName(group.name);
      setNewDescription(group.description ?? "");
      setError("");
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError("Group name is required.");
      nameRef.current?.focus();
      return;
    }

    onSave({
      name: trimmedName,
      description: newDescription.trim() === "" ? null : newDescription.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        <DialogHeader className="text-prfc-brown">
          <DialogTitle className="text-4xl font-black">{group.name}</DialogTitle>
          <DialogDescription className="sr-only">Edit the details for the {group.name} group.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 justify-items-stretch gap-4">
          <Button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting}
            className="justify-self-end bg-transparent border-none p-0 text-prfc-red hover:underline hover:bg-transparent cursor-pointer shadow-none"
          >
            Delete
          </Button>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="groupName" className="font-bold">
              Group Name
            </label>
            <Input
              ref={nameRef}
              type="text"
              id="groupName"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (error) setError("");
              }}
              aria-required="true"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "groupName-error" : undefined}
              className="border-2 border-black"
            />
            {error && (
              <p id="groupName-error" className="text-sm text-prfc-red mt-1">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="description" className="font-bold">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="border-2 border-black"
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="font-bold">Add Members</span>
            <Button
              type="button"
              onClick={onAddMembers}
              disabled={isSubmitting}
              aria-label="Add members to group"
              className="h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300 border-none shadow-none p-0"
            >
              <Plus className="h-5 w-5 text-gray-700" aria-hidden="true" />
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

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-prfc-brown text-white hover:bg-prfc-dark-brown rounded-full py-6 px-8"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
