import { useEffect, useState, type RefObject } from "react";

/** Card height below which LaunchCard should use dense chrome. */
const CARD_COMPACT_HEIGHT = 580;

/**
 * True when the launch card element itself is short (queue + chrome already
 * consumed height). More accurate than window height alone for mid windows.
 */
export function useCardCompact(
  ref: RefObject<HTMLElement | null>,
): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = (height: number) => {
      setCompact(height > 0 && height < CARD_COMPACT_HEIGHT);
    };

    sync(el.getBoundingClientRect().height);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      sync(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return compact;
}
