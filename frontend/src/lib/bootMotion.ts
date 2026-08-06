/**
 * Framer Motion variants for the cold-load console boot sequence.
 */
import type { Variants } from "framer-motion";
import { transitions } from "./motionTokens";

/** Stage lights: starfield + grid */
export const bootStageVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 1.15, ease: "easeOut" },
  },
};

/** Brand + chrome */
export const bootHeaderVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.soft, delay: 0.28 },
  },
};

/** Sys Time lock-in (slightly after brand) */
export const bootSysClockVariants: Variants = {
  hidden: { opacity: 0, y: -6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.soft, delay: 0.48 },
  },
};

/** Queue panel shell */
export const bootPanelVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.soft, delay: 0.42 },
  },
};

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

export const bootQueueItemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: {
    opacity: 1,
    x: 0,
    transition: transitions.soft,
  },
};
