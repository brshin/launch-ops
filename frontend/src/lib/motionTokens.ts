/**
 * Shared Framer Motion timing presets.
 * Import motion primitives from "framer-motion" directly; use these for consistent transitions.
 */
export const transitions = {
  /** Content fade / swap (selection, panel enter) */
  soft: { duration: 0.3, ease: "easeOut" } as const,
  /** Fast feedback (digits, status chips) */
  snappy: { duration: 0.15, ease: "easeOut" } as const,
  /** Layout / selection springs — keep subtle */
  layout: { type: "spring", stiffness: 380, damping: 32 } as const,
} as const;

/**
 * Enter/exit travel distances (px).
 * Compact = below lg — shorter slides so boot feels snappy on phones.
 */
export const travel = {
  desktop: {
    headerY: 10,
    clockY: 6,
    panelY: 12,
    queueX: 12,
    sectionY: 8,
    cardY: 10,
  },
  compact: {
    headerY: 6,
    clockY: 4,
    panelY: 7,
    queueX: 7,
    sectionY: 5,
    cardY: 6,
  },
} as const;

/** Starfield DOM budget — fewer nodes on narrow viewports. */
export const STARFIELD_COUNT = {
  desktop: 250,
  compact: 90,
} as const;
