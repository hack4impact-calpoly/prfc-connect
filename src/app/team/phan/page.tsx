"use client";

import { useState } from "react";
import { GroupEditModal } from "@/components/groups/group-edit-modal";
import { Button } from "@/components/ui/button";

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
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [submittingOpen, setSubmittingOpen] = useState(false);

  return (
    <div className="p-20 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold mb-4">Group Edit Modal Preview</h1>

      <Button onClick={() => setDefaultOpen(true)}>Default State</Button>
      <Button onClick={() => setSubmittingOpen(true)}>Submitting State</Button>

      <GroupEditModal
        open={defaultOpen}
        onOpenChange={setDefaultOpen}
        group={mockGroup}
        onSave={(data) => {
          alert(JSON.stringify(data, null, 2));
          setDefaultOpen(false);
        }}
        onDelete={() => alert("Delete clicked")}
        onAddMembers={() => alert("Add members clicked")}
      />

      <GroupEditModal
        open={submittingOpen}
        onOpenChange={setSubmittingOpen}
        group={mockGroup}
        onSave={() => {}}
        onDelete={() => {}}
        onAddMembers={() => {}}
        isSubmitting
      />
    </div>
  );
}
