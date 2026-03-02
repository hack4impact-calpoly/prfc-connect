"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProtectedError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center px-4">
        <h1 className="font-komika text-prfc-red text-4xl mb-4">Database Error</h1>
        <p className="font-montserrat text-prfc-dark-brown mb-6">Failed to load referral database.</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-prfc-red text-white px-6 py-3 rounded font-montserrat hover:bg-prfc-brown transition-colors"
          >
            Try again
          </button>
          <Link
            href="/home"
            className="bg-prfc-border text-white px-6 py-3 rounded font-montserrat hover:bg-prfc-dark-brown transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
