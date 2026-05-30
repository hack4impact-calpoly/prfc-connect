"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "done" | "error";

export function UnsubscribeForm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  if (!token) {
    return <p className="mt-4 max-w-md text-lg text-muted-foreground">This unsubscribe link is missing its token.</p>;
  }

  async function handleUnsubscribe() {
    setStatus("loading");
    try {
      const res = await fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`, { method: "POST" });
      if (res.status === 204) {
        setStatus("done");
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "We could not process this request.");
      setStatus("error");
    } catch {
      setError("We could not reach the server. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        You have been unsubscribed. You will no longer receive these emails from the Paso Robles Food Co-op.
      </p>
    );
  }

  return (
    <>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        Stop receiving emails from the Paso Robles Food Co-op?
      </p>
      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={status === "loading"}
        className="mt-8 rounded-lg bg-prfc-red px-8 py-3 text-lg font-medium text-white hover:bg-prfc-red/90 disabled:opacity-70"
      >
        {status === "loading" ? "Unsubscribing..." : "Unsubscribe"}
      </button>
      {status === "error" ? <p className="mt-4 max-w-md text-base text-prfc-red">{error}</p> : null}
    </>
  );
}
