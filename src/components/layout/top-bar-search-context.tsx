"use client";

import { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface TopBarSearchContextValue {
  query: string;
  setQuery: (query: string) => void;
}

const TopBarSearchContext = createContext<TopBarSearchContextValue | null>(null);

export function TopBarSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (query !== "") {
      setQuery("");
    }
  }

  return <TopBarSearchContext.Provider value={{ query, setQuery }}>{children}</TopBarSearchContext.Provider>;
}

const noop = () => {};

export function useSearchQuery(): string {
  const ctx = useContext(TopBarSearchContext);
  return ctx?.query ?? "";
}

export function useSetSearchQuery(): (query: string) => void {
  const ctx = useContext(TopBarSearchContext);
  return ctx?.setQuery ?? noop;
}
