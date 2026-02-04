"use client";

import { useState } from "react";

export default function LinPage() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  return (
    <div className="flex flex-col items-center pt-12 gap-3">
      <div className="font-bold text-[40px]">Kyle Lin</div>
      <div className="font-bold text-[25px]">Developer</div>
      <div>
        <strong>Fun Fact: </strong>I like to dance
      </div>
      <button onClick={increment} className="bg-emerald-300 p-5 rounded-xl">
        Click Me!{" "}
      </button>
      <div>
        Count: <div data-testid="count">{count}</div>
      </div>
    </div>
  );
}
