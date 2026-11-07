import { useEffect, useState } from "react";

/**
 * True below Tailwind `xl` (1280px).
 * Desktop shell (sidebar queue + centered globe) needs enough width that Earth
 * does not shrink beside the 320px queue + inspector; mid layout stays through
 * typical laptop widths until xl.
 */
const COMPACT_QUERY = "(max-width: 1279px)";

function readCompact(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(COMPACT_QUERY).matches;
}

/**
 * Tracks whether the viewport should use compact shell / motion / starfield.
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
