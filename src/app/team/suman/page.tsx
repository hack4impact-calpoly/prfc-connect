"use client";

import { useState } from "react";

export default function SumanPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">Saurish Suman</h1>
        <p className="mt-2 text-lg text-muted-foreground">Developer</p>
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Fun Fact</h2>
          <p className="mt-2 text-muted-foreground">
            I am working on a game engine that uses geometric algebra, rather than linear algebra.
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={() => setCount(count + 1)}
            className="rounded-lg bg-foreground px-4 py-2 text-background font-medium hover:opacity-90 transition"
          >
            Click Me!
          </button>
          <span className="text-lg font-semibold text-foreground"> Counter: {count}</span>
        </div>
      </div>
    </div>
  );
}
