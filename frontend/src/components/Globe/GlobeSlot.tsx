import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createBootGlobeVariants } from "../../lib/bootMotion";
import { transitions } from "../../lib/motionTokens";
import { useCompactMotion } from "../../hooks/useCompactMotion";
import type { PadFocus, PadSite } from "../../utils/globeFocus";

const GlobePanel = lazy(() => import("./GlobePanel"));

/**
 * Cold-load globe shell. Canvas mounts early (hidden) so textures warm during
 * boot; once Earth is ready the shell fades in with the console choreography.
 */
export function GlobeSlot({
  maxDpr,
  focus = null,
  pads = [],
}: {
  maxDpr?: number;
  focus?: PadFocus | null;
  pads?: PadSite[];
}) {
  const compactMotion = useCompactMotion();
  const bootGlobeVariants = useMemo(
    () => createBootGlobeVariants(compactMotion),
    [compactMotion],
  );
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  return (
    <div className="relative h-full min-h-0 w-full">
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="aligning"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.soft}
          >
            <motion.p
              className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-700"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              Aligning globe
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative h-full min-h-0 w-full"
        variants={bootGlobeVariants}
        initial="hidden"
        animate={ready ? "show" : "hidden"}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[min(72%,30rem)] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl"
          aria-hidden
        />
        <Suspense fallback={null}>
          <GlobePanel maxDpr={maxDpr} onReady={onReady} focus={focus} pads={pads} />
        </Suspense>
      </motion.div>
    </div>
  );
}
