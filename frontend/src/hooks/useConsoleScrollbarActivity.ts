import { useEffect } from "react";

const HIDE_MS = 1000;

/**
 * Show cyan console scrollbar thumbs only while scrolling (and via CSS :hover).
 * Uses capture so it works for every `.console-scrollbar` without per-ref wiring.
 */
export function useConsoleScrollbarActivity() {
  useEffect(() => {
    const timers = new WeakMap<HTMLElement, number>();

    const onScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains("console-scrollbar")) return;

      target.classList.add("scrollbar-active");
      const prev = timers.get(target);
      if (prev) window.clearTimeout(prev);
      timers.set(
        target,
        window.setTimeout(() => {
          target.classList.remove("scrollbar-active");
        }, HIDE_MS),
      );
    };

    document.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, []);
}
