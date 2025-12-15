"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center px-4">
          <h1 className="text-red-600 text-4xl mb-4 font-bold">Something went wrong</h1>
          <p className="text-gray-700 mb-6">An unexpected error occurred. Please try again.</p>
          {error.digest && <p className="text-gray-500 text-sm mb-4">Error ID: {error.digest}</p>}
          <button
            onClick={reset}
            className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
