/** Device preference for clock faces. Durations (T− / T+) stay as they are. */

export const HOUR_CYCLE_STORAGE_KEY = "launch-ops.hourCycle";

export type HourCycle = "24" | "12";

type HourCycleStorage = Pick<Storage, "getItem" | "setItem">;

export function parseHourCycle(value: string | null | undefined): HourCycle {
  return value === "24" ? "24" : "12";
}

function browserStorage(): HourCycleStorage | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

/** 12-hour unless this device has chosen 24. Storage failures stay on the default. */
export function readHourCycle(storage: HourCycleStorage | null = browserStorage()): HourCycle {
  try {
    return parseHourCycle(storage?.getItem(HOUR_CYCLE_STORAGE_KEY));
  } catch {
    return "12";
  }
}

export function writeHourCycle(
  cycle: HourCycle,
  storage: HourCycleStorage | null = browserStorage(),
): void {
  try {
    storage?.setItem(HOUR_CYCLE_STORAGE_KEY, cycle);
  } catch {
    // Private mode can reject storage. The in-memory choice still applies.
  }
}
