import { useEffect, useState } from "react";

/**
 * Soft short-viewport bands (stacked chrome).
 * Endpoints match the prior ≤700 “short” cliff; mid is only a thin bridge
 * below typical phone portrait (~780+) so default UI stays unchanged.
 *
 * Enter mid  ≤ 740 · exit mid  ≥ 780
 * Enter short ≤ 700 · exit short ≥ 740
 */
const MID_ENTER = 740;
const MID_EXIT = 780;
const SHORT_ENTER = 700;
const SHORT_EXIT = 740;

export type ShortViewportBand = "roomy" | "mid" | "short";

function readHeight(): number {
  if (typeof window === "undefined") return 900;
  return window.innerHeight;
}

function nextBand(height: number, prev: ShortViewportBand): ShortViewportBand {
  if (prev === "short") {
    if (height >= SHORT_EXIT) {
      return height >= MID_EXIT ? "roomy" : "mid";
    }
    return "short";
  }

  if (prev === "mid") {
    if (height <= SHORT_ENTER) return "short";
    if (height >= MID_EXIT) return "roomy";
    return "mid";
  }

  if (height <= SHORT_ENTER) return "short";
  if (height <= MID_ENTER) return "mid";
  return "roomy";
}

/**
 * Viewport-height band with hysteresis — softens the old max-height: 700 cliff
 * without changing the look at common phone / desktop heights.
 */
export function useShortViewportBand(): ShortViewportBand {
  const [band, setBand] = useState<ShortViewportBand>(() =>
    nextBand(readHeight(), "roomy"),
  );

  useEffect(() => {
    const sync = () => {
      setBand((prev) => nextBand(readHeight(), prev));
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return band;
}
