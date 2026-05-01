"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <div className="fixed inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-bold text-red-700 sm:text-4xl">Something went wrong</h1>
          <p className="mt-4 max-w-md text-lg text-gray-600">
            An unexpected error occurred. Try again or reload the page.
          </p>
          {error.digest && <p className="mt-2 text-sm text-gray-400">Error ID: {error.digest}</p>}
          <button
            onClick={reset}
            className="mt-8 rounded-lg bg-red-700 px-8 py-3 text-lg font-medium text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
