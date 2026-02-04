"use client";
import { useState } from "react";

export default function PhanPage() {
  const [counter, setCounter] = useState(0);
  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="max-w-2xl grid grid-cols-1 gap-4">
        <div className="rounded-lg p-8 max-w-2xl bg-emerald-900">
          <h1 className="text-2xl font-bold text-white">Sam Phan</h1>
          <h2 className="text-sm italic text-slate-300">Developer</h2>
          <p className="text-slate-200">
            <span className="font-bold">Fun Fact: </span>
            <span>I have recently finished Season 1 of After Life (Netflix original).</span>
          </p>
        </div>
        <button
          className="rounded-xl px-8 py-4 bg-zinc-800 w-1/2 flex justify-center text-amber-100 justify-self-center"
          onClick={() => setCounter((x) => x + 1)}
        >
          {counter}
        </button>
      </div>
    </div>
  );
}
