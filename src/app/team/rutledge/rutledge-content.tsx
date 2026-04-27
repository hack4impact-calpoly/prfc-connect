"use client";

import { useState } from "react";
import { AddMembersModal, type MemberRow } from "@/components/groups/add-members-modal";
import { Button } from "@/components/ui/button";

const INITIAL_MEMBERS: MemberRow[] = [
  { memberId: 100001, ownername: "Kevin Rutledge", isOwner: true, isSelected: true },
  { memberId: 100002, ownername: "Mary Jones", isOwner: false, isSelected: true },
  { memberId: 100003, ownername: "Tom Wilson", isOwner: false, isSelected: false },
  { memberId: 100004, ownername: "Sarah Chen", isOwner: false, isSelected: false },
  { memberId: 100005, ownername: "Derek Phan", isOwner: false, isSelected: true },
  { memberId: 100006, ownername: "Amy Lin", isOwner: false, isSelected: false },
  { memberId: 100007, ownername: "Jordan Ma", isOwner: false, isSelected: false },
  { memberId: 100008, ownername: "Priya Kakani", isOwner: false, isSelected: false },
];

export function RutledgeContent() {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState(INITIAL_MEMBERS);

  const handleSelectionChange = (memberId: number, selected: boolean) => {
    setMembers((prev) => prev.map((m) => (m.memberId === memberId ? { ...m, isSelected: selected } : m)));
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Add Members Modal Preview</h2>
          <div className="mt-4">
            <Button onClick={() => setOpen(true)} className="bg-prfc-brown text-white hover:bg-prfc-dark-brown">
              Open Add Members Modal
            </Button>
          </div>
        </div>
      </div>
      <AddMembersModal
        open={open}
        onOpenChange={setOpen}
        members={members}
        onSelectionChange={handleSelectionChange}
        onConfirm={() => {
          console.log(
            "Confirm:",
            members.filter((m) => m.isSelected).map((m) => m.ownername),
          );
          setOpen(false);
        }}
      />
    </div>
  );
}
