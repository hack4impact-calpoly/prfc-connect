"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(initialValue: boolean = false): boolean {
  const [isMobile, setIsMobile] = useState(initialValue);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => setIsMobile(mediaQuery.matches);
    onChange();

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
