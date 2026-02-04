"use client";

import { useState } from "react";

export default function AboutMe() {
  const [clicks, setClicks] = useState(0);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
      <h1 className="text-4xl font-bold mb-6">Ethan Ma</h1>

      <div className="mb-6">
        <ul>
          <li>Role: Devolper</li>
          <li>I like snowboarding</li>
        </ul>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setClicks(clicks + 1)} className="bg-blue-500 text-white font-bold py-2 px-6">
            Button
          </button>

          <p className="text-2xl font-bold text-gray-700">Clicks: {clicks}</p>
        </div>
      </div>
    </div>
  );
}
