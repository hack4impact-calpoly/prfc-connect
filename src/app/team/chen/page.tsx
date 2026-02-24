"use client";
import { useState } from "react";
import { DeleteGroupModal } from "@/components/groups/delete-group-modal";
import { Button } from "@/components/ui/button";

export default function ChenTestPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-20 flex flex-col items-center">
      <Button onClick={() => setIsOpen(true)}>Test Delete Modal</Button>

      <DeleteGroupModal
        open={isOpen}
        onOpenChange={setIsOpen}
        groupName="Garden Club"
        onConfirm={() => alert("Deleted!")}
        isDeleting={false}
      />
    </div>
  );
}
