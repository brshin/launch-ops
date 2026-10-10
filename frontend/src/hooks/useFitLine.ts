import { useLayoutEffect, useRef } from "react";
import { useCompactMotion } from "./useCompactMotion";

/** Same size as the phone window caption. Lines do not go smaller than this. */
const FLOOR_PX = 9;

/**
 * Below lg, keep one line at the stylesheet size when it fits.
 * If it overflows, step down one pixel at a time and drop tracking.
 * At the floor, wrap instead of shrinking further or clipping.
 */
export function useFitLine(label: string) {
  const ref = useRef<HTMLParagraphElement>(null);
  const compact = useCompactMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const clear = () => {
      el.style.fontSize = "";
      el.style.letterSpacing = "";
      el.style.whiteSpace = "";
    };

    if (!compact) {
      clear();
      return;
    }

    let frame = 0;

    const fit = () => {
      const node = ref.current;
      if (!node || node.clientWidth < 8) return;

      node.style.fontSize = "";
      node.style.letterSpacing = "";
      node.style.whiteSpace = "nowrap";
      const preferred = Math.round(parseFloat(getComputedStyle(node).fontSize));
      const start = Math.max(preferred, FLOOR_PX);

      let chosen = FLOOR_PX;
      let fits = false;
      for (let size = start; size >= FLOOR_PX; size -= 1) {
        node.style.fontSize = `${size}px`;
        node.style.letterSpacing = size < preferred ? "0px" : "";
        if (node.scrollWidth <= node.clientWidth + 1) {
          chosen = size;
          fits = true;
          break;
        }
      }

      if (fits && chosen === preferred) {
        clear();
        return;
      }

      node.style.fontSize = `${chosen}px`;
      node.style.letterSpacing = chosen < preferred ? "0px" : "";
      node.style.whiteSpace = fits ? "nowrap" : "";
    };

    fit();
    const parent = el.parentElement;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    if (parent) ro.observe(parent);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [compact, label]);

  return ref;
}
