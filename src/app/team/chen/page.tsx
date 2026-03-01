"use client";

import { useState } from "react";
import { DeleteGroupModal } from "@/components/groups/delete-group-modal";
import { Button } from "@/components/ui/button";

export default function ChenTestPage() {
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [deletingOpen, setDeletingOpen] = useState(false);

  return (
    <div className="p-20 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold mb-4">Delete Group Modal Preview</h1>

      <Button onClick={() => setDefaultOpen(true)}>Default State</Button>
      <Button onClick={() => setDeletingOpen(true)}>Deleting State</Button>

      <DeleteGroupModal
        open={defaultOpen}
        onOpenChange={setDefaultOpen}
        groupName="Garden Club"
        onConfirm={() => {
          alert("Deleted!");
          setDefaultOpen(false);
        }}
      />

      <DeleteGroupModal
        open={deletingOpen}
        onOpenChange={setDeletingOpen}
        groupName="Garden Club"
        onConfirm={() => {}}
        isDeleting
      />
    </div>
  );
}
