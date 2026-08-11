import { useEffect, useState } from "react";

/** True below Tailwind `lg` (1024px) — shorter motion travel + lighter starfield. */
const COMPACT_QUERY = "(max-width: 1023px)";

function readCompact(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(COMPACT_QUERY).matches;
}

/**
 * Tracks whether the viewport should use compact motion / starfield budgets.
 * Respects live resize so mid-width ↔ desktop stays consistent.
 */
export function useCompactMotion(): boolean {
  const [compact, setCompact] = useState(readCompact);

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return compact;
}
