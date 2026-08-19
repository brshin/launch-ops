import type { NetPrecision } from "../types/launch";

export type LaunchTimePhase =
  | "live"
  | "elapsed"
  | "countdown"
  | "hold"
  | "provisional"
  | "failed";

export interface LaunchTime {
  phase: LaunchTimePhase;
  /** Compact queue/header copy. Empty when a relative ETA would overstate NET precision. */
  chip: string;
  preciseEnough: boolean;
  msUntilNet: number;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Precision coarser than hour must not imply `21 min`. */
const COARSE_PRECISION = new Set([
  "DAY",
  "WK",
  "WEEK",
  "MON",
  "MONTH",
  "QTR",
  "QUARTER",
  "YR",
  "YEAR",
  "DEC",
  "DECADE",
]);

function toMs(input: string | Date | number): number {
  if (typeof input === "number") return input;
  return (input instanceof Date ? input : new Date(input)).getTime();
}

function precisionAbbrev(precision?: NetPrecision | null): string {
  return (precision?.abbrev || precision?.name || "").trim().toUpperCase();
}

export function isNetPreciseEnough(
  precision?: NetPrecision | null,
): boolean {
  const token = precisionAbbrev(precision);
  if (!token) return true;
  return !COARSE_PRECISION.has(token);
}

function formatRelativeChip(msUntilNet: number): string {
  const sign = msUntilNet > 0 ? "T−" : "T+";
  const abs = Math.abs(msUntilNet);

  if (abs < MINUTE_MS) {
    return `${sign} ${Math.floor(abs / 1000)}s`;
  }
  if (abs < HOUR_MS) {
    return `${sign} ${Math.floor(abs / MINUTE_MS)} min`;
  }
  if (abs < DAY_MS) {
    return `${sign} ${Math.floor(abs / HOUR_MS)} hr`;
  }
  return `${sign} ${Math.floor(abs / DAY_MS)}d`;
}

export function getLaunchTime(input: {
  net: string | Date;
  status?: string | null;
  netPrecision?: NetPrecision | null;
  now?: number | Date;
}): LaunchTime {
  const msUntilNet = toMs(input.net) - toMs(input.now ?? Date.now());
  const status = (input.status ?? "").trim();
  const preciseEnough =
    status !== "TBD" &&
    status !== "TBC" &&
    isNetPreciseEnough(input.netPrecision);

  if (status === "Failure" || status === "Partial Failure") {
    return { phase: "failed", chip: "FAIL", preciseEnough, msUntilNet };
  }
  if (status === "Hold") {
    return { phase: "hold", chip: "HOLD", preciseEnough, msUntilNet };
  }
  if (status === "TBD" || status === "TBC") {
    return {
      phase: "provisional",
      chip: "NET TBD",
      preciseEnough: false,
      msUntilNet,
    };
  }
  if (status === "In Flight") {
    return { phase: "live", chip: "LIVE", preciseEnough, msUntilNet };
  }

  const phase: LaunchTimePhase =
    status === "Success" || msUntilNet <= 0 ? "elapsed" : "countdown";
  const chip = preciseEnough ? formatRelativeChip(msUntilNet) : "";

  return { phase, chip, preciseEnough, msUntilNet };
}
