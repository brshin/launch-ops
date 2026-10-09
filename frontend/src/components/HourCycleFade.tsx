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
  calm = false,
  reserve,
}: {
  cycle: string;
  className?: string;
  children: ReactNode;
  /** Opacity only, stacked, so neighbors in a tight box do not shift. */
  calm?: boolean;
  /** Wider face kept in the layout. Uses `className`, so pass the wider tracking there. */
  reserve?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <span className={className}>{children}</span>;
  }

  if (calm) {
    return (
      <span className="inline-grid align-baseline">
        {reserve ? (
          <span className={`invisible col-start-1 row-start-1 ${className ?? ""}`} aria-hidden>
            {reserve}
          </span>
        ) : null}
        <AnimatePresence initial={false}>
          <motion.span
            key={cycle}
            className={`col-start-1 row-start-1 ${className ?? ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={glide}
          >
            {children}
          </motion.span>
        </AnimatePresence>
      </span>
    );
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
