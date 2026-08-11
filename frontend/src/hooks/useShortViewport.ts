import { useEffect, useState } from "react";

/** True short / landscape heights only — not typical laptop desktops (~900px). */
const SHORT_QUERY = "(max-height: 700px)";

function readShort(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(SHORT_QUERY).matches;
}

/**
 * True when the viewport is short (phone landscape, very short window).
 * Shell compression applies mainly below lg; desktop width keeps roomy chrome.
 */
export function useShortViewport(): boolean {
  const [short, setShort] = useState(readShort);

  useEffect(() => {
    const mq = window.matchMedia(SHORT_QUERY);
    const sync = () => setShort(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return short;
}
