/**
 * Framer Motion variants for the cold-load console boot sequence.
 */
import type { Variants } from "framer-motion";
import { transitions, travel } from "./motionTokens";

type TravelSet = (typeof travel)["desktop"] | (typeof travel)["compact"];

function pickTravel(compact: boolean): TravelSet {
  return compact ? travel.compact : travel.desktop;
}

/** Stage lights: starfield + grid */
export const bootStageVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 1.15, ease: "easeOut" },
  },
};

/** Brand + chrome */
export function createBootHeaderVariants(compact = false): Variants {
  const { headerY } = pickTravel(compact);
  return {
    hidden: { opacity: 0, y: -headerY },
    show: {
      opacity: 1,
      y: 0,
      transition: { ...transitions.soft, delay: 0.28 },
    },
  };
}

/** Sys Time lock-in (slightly after brand) */
export function createBootSysClockVariants(compact = false): Variants {
  const { clockY } = pickTravel(compact);
  return {
    hidden: { opacity: 0, y: -clockY },
    show: {
      opacity: 1,
      y: 0,
      transition: { ...transitions.soft, delay: 0.48 },
    },
  };
}

/** Queue panel shell */
export function createBootPanelVariants(compact = false): Variants {
  const { panelY } = pickTravel(compact);
  return {
    hidden: { opacity: 0, y: panelY },
    show: {
      opacity: 1,
      y: 0,
      transition: { ...transitions.soft, delay: 0.42 },
    },
  };
}

/** Stagger parent for queue rows (first populate) */
export const bootQueueListVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.12,
    },
  },
};

export function createBootQueueItemVariants(compact = false): Variants {
  const { queueX } = pickTravel(compact);
  return {
    hidden: { opacity: 0, x: -queueX },
    show: {
      opacity: 1,
      x: 0,
      transition: transitions.soft,
    },
  };
}

/**
 * Globe hero entrance — slower than panel chrome, starts once Earth is ready.
 * Scale is subtle so the canvas does not read as a UI pop-in.
 */
export function createBootGlobeVariants(compact = false): Variants {
  return {
    hidden: { opacity: 0, scale: compact ? 0.94 : 0.9 },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        // Slight settle after textures resolve so the reveal feels staged.
        delay: compact ? 0.08 : 0.14,
        duration: compact ? 0.65 : 0.95,
        ease: "easeOut",
      },
    },
  };
}
