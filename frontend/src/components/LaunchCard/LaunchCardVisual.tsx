import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { transitions } from "../../lib/motionTokens";

/** Visual feed: rest = always-on HUD; focus = hover or tap intensify. */
const visualFrameVariants: Variants = {
  rest: {},
  focus: {},
};

const visualCornerVariants: Variants = {
  rest: { width: 18, height: 18, borderColor: "rgba(6,182,212,0.55)" },
  focus: { width: 12, height: 12, borderColor: "rgba(103,232,249,0.95)" },
};

const visualCrosshairVariants: Variants = {
  rest: { opacity: 0.18 },
  focus: { opacity: 0.35 },
};

interface LaunchCardVisualProps {
  imageUrl: string | null;
  compactTravel: boolean;
}

/**
 * HUD image (or no-feed placeholder) plus scanlines, corners, and crosshair.
 * Motion wrapper stays on LaunchCard so card stagger still sees a motion child.
 */
export function LaunchCardVisual({
  imageUrl,
  compactTravel,
}: LaunchCardVisualProps) {
  const visualImageVariants: Variants = useMemo(
    () => ({
      rest: { scale: 1, opacity: 0.82 },
      focus: { scale: compactTravel ? 1.02 : 1.04, opacity: 1 },
    }),
    [compactTravel],
  );

  return (
    <motion.div
      className="absolute inset-0"
      variants={visualFrameVariants}
      initial="rest"
      animate="rest"
      whileHover="focus"
      whileTap="focus"
    >
      {imageUrl ? (
        <motion.img
          src={imageUrl}
          variants={visualImageVariants}
          transition={{ duration: 0.85, ease: "easeOut" }}
          className="w-full h-full object-cover mix-blend-screen"
          alt="Launch Visual"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <motion.div
          variants={visualImageVariants}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full h-full flex flex-col items-center justify-center bg-[#020617] mix-blend-screen"
        >
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute w-24 h-24 border border-cyan-900/40 rounded-full"></div>
            <div className="absolute w-16 h-16 border border-cyan-800/50 rounded-full"></div>
            <div className="absolute w-8 h-8 border border-cyan-700/50 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
          </div>
          <span className="text-cyan-600 font-mono text-[10px] tracking-[0.5em] uppercase z-10">
            NO VISUAL FEED
          </span>
        </motion.div>
      )}

      <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,1)] pointer-events-none"></div>

      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(8,145,178,0.05)_50%)] bg-[size:100%_4px] pointer-events-none"></div>

      <motion.div
        variants={visualCornerVariants}
        transition={transitions.snappy}
        className="absolute top-4 left-4 border-t border-l pointer-events-none"
      />
      <motion.div
        variants={visualCornerVariants}
        transition={transitions.snappy}
        className="absolute top-4 right-4 border-t border-r pointer-events-none"
      />
      <motion.div
        variants={visualCornerVariants}
        transition={transitions.snappy}
        className="absolute bottom-4 left-4 border-b border-l pointer-events-none"
      />
      <motion.div
        variants={visualCornerVariants}
        transition={transitions.snappy}
        className="absolute bottom-4 right-4 border-b border-r pointer-events-none"
      />

      <motion.div
        variants={visualCrosshairVariants}
        transition={transitions.soft}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none flex items-center justify-center"
      >
        <div className="w-full h-[1px] bg-cyan-400 absolute"></div>
        <div className="h-full w-[1px] bg-cyan-400 absolute"></div>
      </motion.div>
    </motion.div>
  );
}
