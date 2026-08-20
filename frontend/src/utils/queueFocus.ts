import type { Launch } from "../types/launch";
import { getLaunchTime } from "./launchTime";

/** Index of the live launch, else the next upcoming (non-failed) launch. -1 if neither. */
export function findQueueFocusIndex(launches: Launch[], nowMs: number): number {
  let live = -1;
  let upcoming = -1;
  for (let i = 0; i < launches.length; i++) {
    const t = getLaunchTime({
      net: launches[i].net,
      status: launches[i].status?.abbrev,
      netPrecision: launches[i].net_precision,
      now: nowMs,
    });
    if (live < 0 && t.phase === "live") live = i;
    if (upcoming < 0 && t.msUntilNet > 0 && t.phase !== "failed") upcoming = i;
  }
  return live >= 0 ? live : upcoming;
}

/** apiId to select when none is set, or the previous selection left the queue. */
export function pickDefaultApiId(
  launches: Launch[],
  nowMs: number = Date.now(),
): string | null {
  if (!launches.length) return null;
  const focus = findQueueFocusIndex(launches, nowMs);
  const idx = focus >= 0 ? focus : 0;
  return launches[idx]?.apiId ?? null;
}
