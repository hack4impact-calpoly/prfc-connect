"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-prfc-tan">
      <div className="text-center px-4">
        <h1 className="font-komika text-prfc-red text-4xl mb-4">Something went wrong</h1>
        <p className="font-montserrat text-prfc-dark-brown mb-6">An error occurred. Try refreshing the page.</p>
        <button
          onClick={reset}
          className="bg-prfc-red text-white px-6 py-3 rounded font-montserrat hover:bg-prfc-brown transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
