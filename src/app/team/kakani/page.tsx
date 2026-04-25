"use client";

import { useState } from "react";
import { AddMembersModal } from "@/components/groups/add-members-modal";
import { Button } from "@/components/ui/button";
import { ViewMessageModal } from "@/components/messages/view-message-modal";

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

const mockMessage = {
  id: 1,
  subject: "Garden Party Reminder",
  body: "Garden party at 4pm. Be there or be square.",
  sentAt: new Date("2024-01-06T19:57:01Z"),
  groupName: "Garden Club",
  isBlast: false,
};

const mockRecipients = [
  { memberId: 1, memberName: "Angelica Allison", status: "sent" as const, photoUrl: null },
  { memberId: 2, memberName: "Aya Gallagher", status: "pending" as const, photoUrl: null },
  { memberId: 3, memberName: "Brandon Schwartz", status: "sent" as const, photoUrl: null },
  { memberId: 4, memberName: "Carol White", status: "sent" as const, photoUrl: null },
  { memberId: 5, memberName: "David Brown", status: "pending" as const, photoUrl: null },
  { memberId: 6, memberName: "Eve Davis", status: "sent" as const, photoUrl: null },
  { memberId: 7, memberName: "Frank Miller", status: "sent" as const, photoUrl: null },
  { memberId: 8, memberName: "Grace Wilson", status: "pending" as const, photoUrl: null },
];

const mockBlastMessage = {
  id: 2,
  subject: "All Hands Update",
  body: "Monthly meeting this Friday at noon. Attendance is mandatory.",
  sentAt: new Date("2024-01-06T19:57:01Z"),
  groupName: null,
  isBlast: true,
};

export default function KakaniPage() {
  const [open, setOpen] = useState(false);
  const [submittingOpen, setSubmittingOpen] = useState(false);
  const [members, setMembers] = useState(mockMembers);

  const [viewOpen, setViewOpen] = useState(false);
  const [blastViewOpen, setBlastViewOpen] = useState(false);

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

      <div className="w-full border-t pt-8 mt-4 flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold mb-4">View Message Modal Preview</h1>

        <Button onClick={() => setViewOpen(true)}>Group Message (collapsed → expand to see recipients)</Button>
        <Button onClick={() => setBlastViewOpen(true)}>Blast Message (All Members)</Button>

        <ViewMessageModal
          open={viewOpen}
          onOpenChange={setViewOpen}
          message={mockMessage}
          recipients={mockRecipients}
        />

        <ViewMessageModal
          open={blastViewOpen}
          onOpenChange={setBlastViewOpen}
          message={mockBlastMessage}
          recipients={mockRecipients}
        />
      </div>
    </div>
  );
}
