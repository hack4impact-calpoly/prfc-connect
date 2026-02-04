"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { mockMembers, isMockAdmin } from "@/lib/mock-members";

export default function MockPortalPage() {
  const [selectedMember, setSelectedMember] = useState(mockMembers[0]);
  const [isAdmin, setIsAdmin] = useState(isMockAdmin(100001));
  const [loading, setLoading] = useState(false);

  if (process.env.NODE_ENV === "production") {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p>Not available in production</p>
      </main>
    );
  }

  async function handleLogin() {
    setLoading(true);

    const res = await fetch("/api/dev/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerid: selectedMember.ownerid, isAdmin }),
    });

    if (!res.ok) {
      setLoading(false);
      return;
    }

    const { token } = await res.json();

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/callback";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "token";
    input.value = token;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Mock PRFC Portal</h1>
      <p className="text-gray-600 text-center max-w-md">
        Simulates the PRFC member portal token handoff. In production, members click through from
        pasofoodcooperative.coop/accounts/.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Select Member</span>
          <select
            value={selectedMember.ownerid}
            onChange={(e) => {
              const member = mockMembers.find((m) => m.ownerid === parseInt(e.target.value));
              if (member) {
                setSelectedMember(member);
                setIsAdmin(isMockAdmin(member.ownerid));
              }
            }}
            className="border rounded px-3 py-2"
          >
            {mockMembers.map((member) => (
              <option key={member.ownerid} value={member.ownerid}>
                {member.ownerid} - {member.ownername}
              </option>
            ))}
          </select>
        </label>

        <div className="bg-gray-50 p-3 rounded text-sm">
          <div>
            <strong>Name:</strong> {selectedMember.ownername}
          </div>
          <div>
            <strong>Email:</strong> {selectedMember.owneremail}
          </div>
          <div>
            <strong>Phone:</strong> {selectedMember.ownerphone}
          </div>
          {selectedMember.owneraltphone && (
            <div>
              <strong>Alt Phone:</strong> {selectedMember.owneraltphone}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
          <span className="text-sm">Admin access</span>
        </label>

        <Button onClick={handleLogin} disabled={loading}>
          {loading ? "Redirecting..." : "Enter PRFC Connect"}
        </Button>
      </div>
    </main>
  );
}
