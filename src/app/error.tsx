"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-angkor text-3xl text-prfc-brown sm:text-4xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        An unexpected error occurred. Try again or return to the dashboard.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-prfc-red px-8 py-3 text-lg font-medium text-white hover:bg-prfc-red/90"
        >
          Try again
        </button>
        <Link
          href="/home"
          className="rounded-lg border border-border px-8 py-3 text-lg font-medium text-foreground hover:bg-muted"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
