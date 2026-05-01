"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProtectedError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="px-4 text-center">
        <h1 className="font-angkor text-4xl text-prfc-red">Something went wrong</h1>
        <p className="mt-4 text-muted-foreground">
          An unexpected error occurred. Try again or return to the dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-prfc-red px-6 py-3 font-medium text-white hover:bg-prfc-red/90"
          >
            Try again
          </button>
          <Link href="/home" className="rounded-lg bg-prfc-border px-6 py-3 font-medium text-white hover:bg-prfc-brown">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
