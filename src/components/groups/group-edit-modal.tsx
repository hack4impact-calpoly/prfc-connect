"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
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

interface QuickEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: number;
    name: string;
    description: string | null;
  };
  onSave: (data: { name: string; description: string | null }) => void;
  isSubmitting?: boolean;
}

export function GroupEditModal({ open, onOpenChange, group, onSave, isSubmitting = false }: QuickEditModalProps) {
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
        className="[&>button:last-child]:hidden"
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-angkor text-2xl font-normal">Quick Edit</DialogTitle>
            <DialogDescription className="sr-only">Edit the name and description for this group.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <Input
                ref={nameRef}
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Group Name"
                aria-required="true"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "groupName-error" : undefined}
              />
              {error && (
                <p id="groupName-error" className="mt-1 text-sm text-prfc-red">
                  {error}
                </p>
              )}
            </div>

            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description..."
              rows={3}
            />

            <p className="text-sm text-muted-foreground">Add/Remove members in &ldquo;View Group&rdquo; tab.</p>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" onClick={() => handleOpenChange(false)} variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!newName.trim() || isSubmitting}
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
