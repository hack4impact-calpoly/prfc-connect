"use client";

import { useState } from "react";
import { GroupEditModal } from "@/components/groups/group-edit-modal";
import { Button } from "@/components/ui/button";

export function RutledgeContent() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Quick Edit Modal Preview</h2>
          <div className="mt-4">
            <Button onClick={() => setOpen(true)} className="bg-prfc-brown text-white hover:bg-prfc-dark-brown">
              Open Quick Edit Modal
            </Button>
          </div>
        </div>
      </div>
      <GroupEditModal
        open={open}
        onOpenChange={setOpen}
        group={{ id: 1, name: "Board of Directors", description: "Executive leadership team" }}
        onSave={(data) => {
          console.log("Save:", data);
          setOpen(false);
        }}
      />
    </div>
  );
}
