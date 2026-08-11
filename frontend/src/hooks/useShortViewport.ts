import { useEffect, useState } from "react";

/** Tall enough for the full console chrome; below this, compress layout. */
const SHORT_QUERY = "(max-height: 700px)";

function readShort(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(SHORT_QUERY).matches;
}

/**
 * True when the viewport is short (phone landscape, short desktop window).
 * Used to compress chrome, thin the queue strip, and keep one nested scroller.
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
