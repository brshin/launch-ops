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
