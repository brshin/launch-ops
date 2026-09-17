import { motion } from "framer-motion";
import { bootStageVariants } from "../lib/bootMotion";
import { STARFIELD_COUNT } from "../lib/motionTokens";
import { useCompactMotion } from "../hooks/useCompactMotion";

function createStarfield(count: number) {
  return Array.from({ length: count }).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${Math.random() * 3 + 2}s`,
  }));
}

/** Pre-generate full field once; slice for compact viewports to avoid regen jitter. */
const starfieldPool = createStarfield(STARFIELD_COUNT.desktop);

/**
 * Ambient space background. Owns the star pool and compact-viewport budget.
 */
export function Starfield() {
  const compactMotion = useCompactMotion();
  const starfield = compactMotion
    ? starfieldPool.slice(0, STARFIELD_COUNT.compact)
    : starfieldPool;

  return (
    <motion.div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center"
      variants={bootStageVariants}
      initial="hidden"
      animate="show"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#020617] to-[#020617]"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-cyan-600/5 blur-[150px] animate-[pulse_6s_ease-in-out_infinite]"></div>

      <div className="absolute w-[150vw] h-[150vw] animate-[spin_240s_linear_infinite]">
        {starfield.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-100"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: star.animationDelay,
              animationDuration: star.animationDuration,
              boxShadow: star.size > 1.5 ? "0 0 6px 1px rgba(34,211,238,0.6)" : "none",
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0891b215_1px,transparent_1px),linear-gradient(to_bottom,#0891b215_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_40%,transparent_100%)] opacity-50"></div>
    </motion.div>
  );
}
