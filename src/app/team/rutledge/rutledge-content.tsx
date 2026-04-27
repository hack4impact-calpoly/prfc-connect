"use client";

import { useState } from "react";
import { CreateGroupModal } from "@/components/groups/create-group-modal";
import { Button } from "@/components/ui/button";

const MOCK_MEMBERS = [
  { memberId: 100001, ownername: "Kevin Rutledge" },
  { memberId: 100002, ownername: "Mary Jones" },
  { memberId: 100003, ownername: "Tom Wilson" },
  { memberId: 100004, ownername: "Sarah Chen" },
  { memberId: 100005, ownername: "Derek Phan" },
  { memberId: 100006, ownername: "Amy Lin" },
  { memberId: 100007, ownername: "Jordan Ma" },
  { memberId: 100008, ownername: "Priya Kakani" },
];

export function RutledgeContent() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Create Group Modal Preview</h2>
          <div className="mt-4">
            <Button onClick={() => setOpen(true)} className="bg-prfc-brown text-white hover:bg-prfc-dark-brown">
              Open Create Group Modal
            </Button>
          </div>
        </div>
      </div>
      <CreateGroupModal
        open={open}
        onOpenChange={setOpen}
        onSubmit={(data) => {
          console.log("Create group:", data);
          setOpen(false);
        }}
        members={MOCK_MEMBERS}
      />
    </div>
  );
}
