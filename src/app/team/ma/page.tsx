"use client";

import { useState } from "react";
import { CreateGroupModal } from "@/components/groups/create-group-modal";
import { Button } from "@/components/ui/button";

export default function MaPage() {
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [submittingOpen, setSubmittingOpen] = useState(false);

  return (
    <div className="p-20 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold mb-4">Create Group Modal Preview</h1>

      <Button onClick={() => setDefaultOpen(true)}>Default State</Button>
      <Button onClick={() => setSubmittingOpen(true)}>Submitting State</Button>

      <CreateGroupModal
        open={defaultOpen}
        onOpenChange={setDefaultOpen}
        onSubmit={(data) => {
          alert(JSON.stringify(data, null, 2));
          setDefaultOpen(false);
        }}
      />

      <CreateGroupModal open={submittingOpen} onOpenChange={setSubmittingOpen} onSubmit={() => {}} isSubmitting />
    </div>
  );
}
