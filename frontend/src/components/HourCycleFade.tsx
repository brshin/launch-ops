import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const glide = { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const };

/**
 * Crossfade a clock face when the hour cycle changes.
 * Keyed on the cycle, so the 1s tick still updates in place.
 */
export function HourCycleFade({
  cycle,
  className,
  children,
}: {
  cycle: string;
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={cycle}
        className={className}
        initial={{ opacity: 0, y: 3, filter: "blur(3px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -3, filter: "blur(3px)" }}
        transition={glide}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
