"use client";

import { useState } from "react";
import { GroupDetailViewModal } from "@/components/groups/group-detail-view-modal";
import { Button } from "@/components/ui/button";
import { EntityCard } from "@/components/groups/entity-card";

const mockGroup = {
  id: 1,
  name: "Friends",
  description: "People I keep in touch with.",
  members: [
    { memberId: 1, ownername: "Alice Johnson" },
    { memberId: 2, ownername: "Bob Smith" },
    { memberId: 3, ownername: "Charlie Brown" },
    { memberId: 4, ownername: "Diana Prince" },
    { memberId: 5, ownername: "Ethan Hunt" },
    { memberId: 6, ownername: "Fiona Apple" },
    { memberId: 7, ownername: "George Lucas" },
    { memberId: 8, ownername: "Hannah Montana" },
    { memberId: 9, ownername: "Isaac Newton" },
    { memberId: 10, ownername: "Julia Child" },
  ],
  memberCount: 10,
};

export default function PhanPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-20 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold mb-4">Group Detail View Modal Preview</h1>

      <Button onClick={() => setOpen(true)}>Open Detail View</Button>

      <GroupDetailViewModal open={open} onOpenChange={setOpen} group={mockGroup} onEdit={() => alert("Edit clicked")} />

      <EntityCard
        variant="group"
        name="Testing"
        memberCount={42}
        onViewGroup={() => console.log("View group clicked")}
        onQuickEdit={() => console.log("Quick edit clicked")}
        onDelete={() => console.log("Delete clicked")}
      />
    </div>
  );
}
