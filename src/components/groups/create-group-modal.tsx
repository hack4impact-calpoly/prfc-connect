"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description: string | null }) => void;
  isSubmitting?: boolean;
}

export function CreateGroupModal({ open, onOpenChange, onSubmit, isSubmitting }: CreateGroupModalProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Group name is required.");
      return;
    }
    onSubmit({ name, description: description || null });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setDescription("");
      setError("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Contact Group</DialogTitle>
        </DialogHeader>

        <div>
          <Label htmlFor="group-name">
            Group Name <span style={{ color: "#831002" }}>*</span>
          </Label>

          <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="" />
          {error && <p style={{ color: "#831002" }}>Group name is required.</p>}
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>

          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder=""
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => handleOpenChange(false)}
            style={{ borderColor: "#831002", color: "#831002" }}
            variant="outline"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            style={{ backgroundColor: "#523019" }}
            disabled={!name.trim() || isSubmitting}
          >
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
