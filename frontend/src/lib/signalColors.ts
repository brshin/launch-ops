/**
 * Shared signal colors — one meaning per hue across queue, card, and console.
 * Human-readable map: docs/color-scheme.md
 *
 *   cyan     brand / schedule / upcoming
 *   emerald  live / Go / positive energy
 *   green    Success (finished well — deeper than Live)
 *   amber    caution / Hold / reschedule / provisional
 *   violet   soft meta (TBC, status-changed chip)
 *   red/rose failure
 *   slate    gone / unknown / muted
 */

import type { ConsoleUpdateKind } from "../utils/consoleUpdates";

/** Text tones used by chips and labels. */
export const signalText = {
  brand: "text-cyan-300",
  upcoming: "text-cyan-400",
  /** Live webcast / In Flight / STREAM — not Success. */
  live: "text-emerald-400",
  liveGlow: "[text-shadow:0_0_8px_rgba(52,211,153,0.55)]",
  go: "text-emerald-300",
  /** Mission outcome — deeper than Live. */
  success: "text-green-400",
  caution: "text-amber-400",
  meta: "text-violet-300",
  fail: "text-red-400",
  muted: "text-slate-500",
} as const;

/** Console Recent-updates kind chips. */
export function consoleUpdateAccent(kind: ConsoleUpdateKind): string {
  switch (kind) {
    case "webcast":
      return `${signalText.live} ${signalText.liveGlow}`;
    case "scheduled":
      return signalText.brand;
    case "rescheduled":
      return signalText.caution;
    case "status":
      return signalText.meta;
    case "removed":
      return signalText.muted;
  }
}
