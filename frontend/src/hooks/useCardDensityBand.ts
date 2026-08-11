import { useEffect, useState, type RefObject } from "react";

/**
 * Soft density bands for LaunchCard chrome (stacked / below lg only).
 * Endpoints match the prior boolean cliff (~580): roomy above, dense well below.
 * Mid is a thin bridge; hysteresis avoids flicker when padding changes height.
 *
 * Enter mid  < 600 · exit mid  > 640
 * Enter dense < 540 · exit dense > 580
 */
const MID_ENTER = 600;
const MID_EXIT = 640;
const DENSE_ENTER = 540;
const DENSE_EXIT = 580;

export type CardDensity = "roomy" | "mid" | "dense";

function nextBand(height: number, prev: CardDensity): CardDensity {
  if (height <= 0) return prev;

  if (prev === "dense") {
    if (height > DENSE_EXIT) {
      return height > MID_EXIT ? "roomy" : "mid";
    }
    return "dense";
  }

  if (prev === "mid") {
    if (height < DENSE_ENTER) return "dense";
    if (height > MID_EXIT) return "roomy";
    return "mid";
  }

  // roomy
  if (height < DENSE_ENTER) return "dense";
  if (height < MID_ENTER) return "mid";
  return "roomy";
}

/**
 * Card-height density with mid band + hysteresis so resize feels stepped,
 * not a single cliff at 580px — while typical phone cards stay roomy.
 */
export function useCardDensityBand(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): CardDensity {
  const [band, setBand] = useState<CardDensity>("roomy");

  useEffect(() => {
    if (!enabled) {
      setBand("roomy");
      return;
    }

    const el = ref.current;
    if (!el) return;

    const sync = (height: number) => {
      setBand((prev) => nextBand(height, prev));
    };

    sync(el.getBoundingClientRect().height);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      sync(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, enabled]);

  return enabled ? band : "roomy";
}
