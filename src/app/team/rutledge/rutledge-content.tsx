"use client";

import { ComposeMessageForm } from "@/components/messages/compose-message-form";

const MOCK_GROUPS = [
  { id: 1, name: "PRFC Members" },
  { id: 2, name: "Volunteers" },
  { id: 3, name: "Board of Directors" },
  { id: 4, name: "Garden Committee" },
];

export function RutledgeContent() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <ComposeMessageForm
            groups={MOCK_GROUPS}
            currentUser={{ name: "Kevin Rutledge" }}
            smsConsent={{ eligible: 95, total: 120 }}
            onSend={(data) => console.log("Send:", data)}
          />
        </div>
      </div>
    </div>
  );
}
