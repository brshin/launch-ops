import { useEffect, useState } from "react";
import type { SysClock } from "../components/ConsoleHeader";
import {
  formatLocalDate,
  formatLocalTime,
  getLocalUtcOffsetLabel,
} from "../utils/localTime";

/**
 * Local Sys Time tick. Belongs to App — header displays it, queue chips use nowMs.
 */
export function useSysClock(): SysClock | null {
  const [sysClock, setSysClock] = useState<SysClock | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setSysClock({
        date: formatLocalDate(now),
        time: formatLocalTime(now, { includeSeconds: true }),
        offset: getLocalUtcOffsetLabel(now),
        nowMs: now.getTime(),
      });
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);

  return sysClock;
}
