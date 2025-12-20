"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function MockPortalPage() {
  const [ownerid, setOwnerid] = useState("100184");
  const [isAdmin, setIsAdmin] = useState(true);
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
      body: JSON.stringify({ ownerid: parseInt(ownerid), isAdmin }),
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

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Owner ID</span>
          <input
            type="text"
            value={ownerid}
            onChange={(e) => setOwnerid(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </label>

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
