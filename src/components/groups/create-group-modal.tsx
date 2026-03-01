"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description: string | null }) => void;
  isSubmitting?: boolean;
}

export function CreateGroupModal({ open, onOpenChange, onSubmit, isSubmitting = false }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name is required.");
      nameRef.current?.focus();
      return;
    }
    onSubmit({ name: name.trim(), description: description.trim() || null });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (!nextOpen) {
      setName("");
      setDescription("");
      setError("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Contact Group</DialogTitle>
            <DialogDescription className="sr-only">
              Fill in the details below to create a new contact group.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Label htmlFor="group-name">
              Group Name <span className="text-prfc-red">*</span>
            </Label>
            <Input
              ref={nameRef}
              id="group-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              aria-required="true"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "group-name-error" : undefined}
            />
            {error && (
              <p id="group-name-error" className="text-sm text-prfc-red mt-1">
                {error}
              </p>
            )}
          </div>

          <div className="mt-4">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              variant="outline"
              className="border-prfc-red text-prfc-red hover:bg-red-100"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="bg-prfc-brown text-white hover:bg-prfc-dark-brown"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
