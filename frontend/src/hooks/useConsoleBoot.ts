import { useEffect, useRef, useState } from "react";

/** Minimum stage time once data exists — enough to read the bring-up. */
const BOOT_MIN_MS = 1200;
/** Hard cap so a slow/failed fetch never traps the UI. */
const BOOT_MAX_MS = 2100;

/**
 * Cold-load console boot: short choreography window that completes when data
 * arrives (after a minimum) or when the max cap is hit. Not user-skippable.
 */
export function useConsoleBoot(hasLaunches: boolean) {
  const [bootComplete, setBootComplete] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (bootComplete) return;
    const timer = window.setTimeout(() => setBootComplete(true), BOOT_MAX_MS);
    return () => window.clearTimeout(timer);
  }, [bootComplete]);

  useEffect(() => {
    if (bootComplete || !hasLaunches) return;

    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, BOOT_MIN_MS - elapsed);
    const timer = window.setTimeout(() => setBootComplete(true), remaining);
    return () => window.clearTimeout(timer);
  }, [hasLaunches, bootComplete]);

  return {
    bootComplete,
    isBooting: !bootComplete,
  };
}
