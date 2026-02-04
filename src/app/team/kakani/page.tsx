"use client";

import { useState } from "react";

export default function KakaniPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-lg">
        <h1 className="text-4xl font-medium mb-2">Snehil Kakani</h1>
        <p className="text-gray-600 mb-4">Developer</p>
        <h1>Interests</h1>
        <ul className="list-disc list-inside mb-8">
          <li className="">music production</li>
          <li className="">photography</li>
          <li className="">video games</li>
        </ul>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="text-sm border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
        >
          count: {count}
        </button>
      </div>
    </div>
  );
}
