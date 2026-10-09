import { useEffect, useState } from "react";
import {
  HOUR_CYCLE_STORAGE_KEY,
  parseHourCycle,
  readHourCycle,
  writeHourCycle,
  type HourCycle,
} from "../utils/hourCycle";

/**
 * 12-hour by default. The choice is written to localStorage so this device
 * keeps it, including across tabs.
 */
export function useHourCycle() {
  const [cycle, setCycleState] = useState<HourCycle>(() => readHourCycle());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== HOUR_CYCLE_STORAGE_KEY) return;
      setCycleState(parseHourCycle(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setCycle = (next: HourCycle) => {
    setCycleState(next);
    writeHourCycle(next);
  };

  return { cycle, hour12: cycle === "12", setCycle };
}
