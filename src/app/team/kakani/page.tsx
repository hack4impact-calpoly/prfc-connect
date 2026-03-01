"use client";

import { useState } from "react";
import { AddMembersModal } from "@/components/groups/add-members-modal";
import { Button } from "@/components/ui/button";

const mockMembers = [
  { memberId: 1, ownername: "Alice Johnson", isOwner: true, isSelected: true },
  { memberId: 2, ownername: "Bob Smith", isOwner: false, isSelected: true },
  { memberId: 3, ownername: "Carol White", isOwner: false, isSelected: false },
  { memberId: 4, ownername: "David Brown", isOwner: false, isSelected: true },
  { memberId: 5, ownername: "Eve Davis", isOwner: false, isSelected: false },
  { memberId: 6, ownername: "Frank Miller", isOwner: false, isSelected: false },
  { memberId: 7, ownername: "Grace Wilson", isOwner: false, isSelected: true },
  { memberId: 8, ownername: "Hank Taylor", isOwner: false, isSelected: false },
];

export default function KakaniPage() {
  const [open, setOpen] = useState(false);
  const [submittingOpen, setSubmittingOpen] = useState(false);
  const [members, setMembers] = useState(mockMembers);

  const handleSelectionChange = (memberId: number, selected: boolean) => {
    setMembers((prev) => prev.map((m) => (m.memberId === memberId ? { ...m, isSelected: selected } : m)));
  };

  return (
    <div className="p-20 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold mb-4">Add Members Modal Preview</h1>

      <Button onClick={() => setOpen(true)}>Default State</Button>
      <Button onClick={() => setSubmittingOpen(true)}>Submitting State</Button>

      <AddMembersModal
        open={open}
        onOpenChange={setOpen}
        groupName="Garden Club"
        members={members}
        onSelectionChange={handleSelectionChange}
        onConfirm={() => {
          alert("Saved!");
          setOpen(false);
        }}
      />

      <AddMembersModal
        open={submittingOpen}
        onOpenChange={setSubmittingOpen}
        groupName="Garden Club"
        members={members}
        onSelectionChange={handleSelectionChange}
        onConfirm={() => {}}
        isSubmitting
      />
    </div>
  );
}
