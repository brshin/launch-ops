import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { transitions } from "../lib/motionTokens";

type FlashKind = "connect" | "disconnect";

interface FeedStatusProps {
  live: boolean;
  /** Soft boot state before live/offline is meaningful */
  arming?: boolean;
  liveLabel?: string;
  offlineLabel?: string;
  armingLabel?: string;
  className?: string;
  /** Show the status dot (default true) */
  showDot?: boolean;
}

/**
 * Feed link indicator: calm when stable; one-shot flash only when
 * connection state changes (not a perpetual ping).
 */
export function FeedStatus({
  live,
  arming = false,
  liveLabel = "Live Feed",
  offlineLabel = "Feed Offline",
  armingLabel = "Arming Feed",
  className = "",
  showDot = true,
}: FeedStatusProps) {
  const prevLive = useRef<boolean | null>(null);
  const [flash, setFlash] = useState<FlashKind | null>(null);

  useEffect(() => {
    if (prevLive.current === null) {
      prevLive.current = live;
      return;
    }
    if (prevLive.current === live) return;

    setFlash(live ? "connect" : "disconnect");
    prevLive.current = live;
    const timer = window.setTimeout(() => setFlash(null), 650);
    return () => window.clearTimeout(timer);
  }, [live]);

  const label = live ? liveLabel : arming ? armingLabel : offlineLabel;
  const accent = live ? "cyan" : "amber";

  return (
    <motion.span
      className={`inline-flex items-center gap-2 font-mono uppercase tracking-wider transition-colors duration-300 ${
        live
          ? "text-cyan-400"
          : arming
            ? "text-amber-500/90"
            : "text-amber-500/90"
      } ${className}`}
      title={
        live
          ? "Connected to the live launch feed"
          : arming
            ? "Arming live feed…"
            : "Disconnected from the live launch feed"
      }
      animate={
        flash === "connect"
          ? { opacity: [1, 0.55, 1] }
          : flash === "disconnect"
            ? { opacity: [1, 0.5, 1], x: [0, -1.5, 1.5, 0] }
            : { opacity: 1, x: 0 }
      }
      transition={
        flash
          ? { duration: 0.45, ease: "easeOut" }
          : transitions.snappy
      }
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <AnimatePresence>
            {flash && (
              <motion.span
                key={flash}
                className={`absolute inset-0 rounded-full ${
                  accent === "cyan" ? "bg-cyan-400" : "bg-amber-500"
                }`}
                initial={{ scale: 1, opacity: 0.9 }}
                animate={{ scale: 2.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              live
                ? "bg-cyan-400 shadow-[0_0_5px_#22d3ee]"
                : "bg-amber-500 shadow-[0_0_5px_#f59e0b]"
            }`}
          />
        </span>
      )}
      {label}
    </motion.span>
  );
}
