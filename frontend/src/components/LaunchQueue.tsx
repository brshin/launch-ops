import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FeedStatus } from "./FeedStatus";
import { Launch } from "../types/launch";
import { getLaunchTitle } from "../utils/launchTitle";
import { getLaunchTime, type LaunchTimePhase } from "../utils/launchTime";
import { findQueueFocusIndex } from "../utils/queueFocus";
import { isWebcastLive } from "../utils/watchTarget";
import { transitions } from "../lib/motionTokens";
import {
  bootQueueListVariants,
  createBootPanelVariants,
  createBootQueueItemVariants,
} from "../lib/bootMotion";
import { useCompactMotion } from "../hooks/useCompactMotion";
import type { ShortViewportBand } from "../hooks/useShortViewportBand";
import { formatLocalDateTime, getLocalUtcOffsetLabel } from "../utils/localTime";

const HOUR_MS = 60 * 60 * 1000;

const queueChipBase =
  "shrink-0 text-[9px] md:text-[10px] leading-tight font-mono uppercase tracking-wider tabular-nums";

const streamChipClass = `${queueChipBase} text-cyan-300 font-bold [text-shadow:0_0_8px_rgba(34,211,238,0.75)]`;

function queueChipClass(phase: LaunchTimePhase, msUntilNet: number): string {
  switch (phase) {
    case "live":
      return streamChipClass;
    case "elapsed":
      return `${queueChipBase} text-emerald-400`;
    case "hold":
    case "provisional":
      return `${queueChipBase} text-amber-400`;
    case "failed":
      return `${queueChipBase} text-red-400`;
    default:
      return msUntilNet <= HOUR_MS
        ? `${queueChipBase} text-cyan-300`
        : `${queueChipBase} text-cyan-500`;
  }
}

interface LaunchQueueProps {
  launches: Launch[];
  selectedIndex: number;
  nowMs: number;
  onSelect: (apiId: string) => void;
  feedLive: boolean;
  isBooting: boolean;
  shortBand: ShortViewportBand;
  utcOffset?: string | null;
}

/**
 * Upcoming-launch strip / sidebar. Owns scroll-edge fades, row chips, and queue boot.
 * Selection and the clock tick stay in App — the detail card needs both.
 */
export function LaunchQueue({
  launches,
  selectedIndex,
  nowMs,
  onSelect,
  feedLive,
  isBooting,
  shortBand,
  utcOffset,
}: LaunchQueueProps) {
  const [queueRevealed, setQueueRevealed] = useState(false);
  const queueScrollRef = useRef<HTMLDivElement>(null);
  const [queueEdges, setQueueEdges] = useState({ left: false, right: false });

  const compactMotion = useCompactMotion();
  const bootPanelVariants = useMemo(
    () => createBootPanelVariants(compactMotion),
    [compactMotion],
  );
  const bootQueueItemVariants = useMemo(
    () => createBootQueueItemVariants(compactMotion),
    [compactMotion],
  );

  const focusIndex = useMemo(
    () => findQueueFocusIndex(launches, nowMs),
    [launches, nowMs],
  );

  const syncQueueEdges = useCallback(() => {
    const el = queueScrollRef.current;
    if (!el) return;
    // Vertical sidebar at lg — no horizontal edge cues needed.
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setQueueEdges({ left: false, right: false });
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft > 14;
    const right = maxScroll > 14 && el.scrollLeft < maxScroll - 14;
    setQueueEdges((prev) =>
      prev.left === left && prev.right === right ? prev : { left, right },
    );
  }, []);

  useEffect(() => {
    if (launches.length > 0) setQueueRevealed(true);
  }, [launches]);

  useEffect(() => {
    const el = queueScrollRef.current;
    if (!el) return;

    syncQueueEdges();
    el.addEventListener("scroll", syncQueueEdges, { passive: true });
    const ro = new ResizeObserver(() => syncQueueEdges());
    ro.observe(el);
    window.addEventListener("resize", syncQueueEdges);

    return () => {
      el.removeEventListener("scroll", syncQueueEdges);
      ro.disconnect();
      window.removeEventListener("resize", syncQueueEdges);
    };
  }, [launches, queueRevealed, syncQueueEdges]);

  return (
    <motion.div
      className="w-full lg:w-[320px] h-auto shrink-0 lg:h-full lg:min-h-0 flex flex-col bg-black/10 backdrop-blur-sm border border-cyan-900/50 rounded-2xl shadow-[0_0_35px_rgba(8,145,178,0.12)] overflow-clip"
      variants={bootPanelVariants}
      initial="hidden"
      animate="show"
    >
      <div
        className={`border-b border-cyan-800/50 bg-black/30 flex justify-between items-center shadow-lg z-20 shrink-0 gap-2 lg:gap-3 density-ease ${
          shortBand === "short"
            ? "px-2 py-1 lg:p-4"
            : shortBand === "mid"
              ? "px-2.5 py-1.5 lg:p-4"
              : "px-3 py-2 lg:p-4"
        }`}
      >
        <h2
          className={`text-cyan-400 font-mono uppercase flex items-center gap-2 lg:gap-3 min-w-0 density-ease ${
            shortBand === "short"
              ? "tracking-[0.15em] text-[9px] lg:tracking-[0.25em] lg:text-xs"
              : shortBand === "mid"
                ? "tracking-[0.17em] text-[9px] sm:text-[10px] lg:tracking-[0.25em] lg:text-xs"
                : "tracking-[0.2em] lg:tracking-[0.25em] text-[10px] lg:text-xs"
          }`}
        >
          <span className="relative flex h-1.5 w-1.5 lg:h-2 lg:w-2 shrink-0">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 lg:h-2 lg:w-2 bg-cyan-500 shadow-[0_0_8px_#22d3ee]"></span>
          </span>
          Launch Queue
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <FeedStatus
            live={feedLive}
            arming={isBooting && !feedLive}
            liveLabel="Feed Live"
            offlineLabel="Feed Offline"
            armingLabel="Arming Feed"
            className="text-[9px]"
          />
          <span
            className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider"
            title="Queue times shown in your local timezone"
          >
            {utcOffset ?? getLocalUtcOffsetLabel()}
          </span>
        </div>
      </div>

      <div className="relative min-h-0 lg:flex-1 lg:min-h-0 flex flex-col">
        <motion.div
          ref={queueScrollRef}
          className={`console-scrollbar console-scrollbar-y relative z-10 flex flex-row overflow-x-auto overflow-y-hidden snap-x snap-mandatory lg:flex-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:snap-none overscroll-x-contain lg:overscroll-y-contain density-ease ${
            shortBand === "short"
              ? "gap-1.5 p-1.5 max-lg:pr-7 lg:gap-2 lg:p-3"
              : shortBand === "mid"
                ? "gap-1.5 p-2 max-lg:pr-7 lg:gap-2 lg:p-3"
                : "gap-2 p-2.5 max-lg:pr-8 lg:p-3"
          }`}
          variants={bootQueueListVariants}
          initial="hidden"
          animate={queueRevealed ? "show" : "hidden"}
        >
          {launches.map((launch, index) => {
            const provider =
              launch.launch_service_provider?.abbrev ||
              launch.launch_service_provider?.name ||
              null;
            const selected = selectedIndex === index;
            const launchTime = getLaunchTime({
              net: launch.net,
              status: launch.status?.abbrev,
              netPrecision: launch.net_precision,
              now: nowMs,
            });
            const isFocus = index === focusIndex;
            const isPast =
              launchTime.msUntilNet <= 0 && launchTime.phase !== "live";
            const showNext = isFocus && launchTime.phase !== "live";
            const streaming = isWebcastLive({
              webcastLive: launch.webcast_live,
              vidUrls: launch.vid_urls,
            });
            // STREAM replaces T−/T+/NET TBD while a webcast is on; LIVE/HOLD/FAIL stay.
            const showStreamChip =
              streaming &&
              launchTime.phase !== "live" &&
              launchTime.phase !== "hold" &&
              launchTime.phase !== "failed";

            return (
              <motion.button
                key={launch.apiId || index}
                type="button"
                variants={bootQueueItemVariants}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (launch.apiId) onSelect(launch.apiId);
                }}
                className={`shrink-0 snap-start w-[11rem] sm:w-[12.5rem] lg:w-full min-h-11 text-left py-2.5 px-3 lg:py-3 lg:px-4 rounded-lg border transition-[colors,opacity] duration-300 flex flex-col justify-center gap-0.5 lg:gap-1 relative overflow-clip group cursor-pointer touch-manipulation ${
                  selected
                    ? "bg-cyan-950/40 border-cyan-500/60 shadow-[inset_0_0_15px_rgba(34,211,238,0.15)]"
                    : isFocus
                      ? "bg-cyan-950/20 border-cyan-600/45 hover:bg-cyan-900/20 hover:border-cyan-700/50 active:bg-cyan-900/25 active:border-cyan-600/60"
                      : "bg-black/20 border-cyan-900/30 hover:bg-cyan-900/20 hover:border-cyan-700/50 active:bg-cyan-900/25 active:border-cyan-600/60"
                } ${isPast && !selected ? "opacity-50" : "opacity-100"}`}
              >
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      key="selected-bar"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee] lg:inset-x-auto lg:left-0 lg:top-0 lg:bottom-0 lg:h-auto lg:w-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={transitions.snappy}
                    />
                  )}
                </AnimatePresence>

                <div className="flex items-baseline justify-between gap-1.5 w-full min-w-0">
                  <span className="min-w-0 truncate text-[9px] md:text-[10px] leading-tight font-mono text-cyan-500 tracking-[0.15em] tabular-nums group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors">
                    {formatLocalDateTime(launch.net, { includeYear: false }).label}
                  </span>
                  <span className="flex items-baseline gap-1.5 shrink-0">
                    {showNext && (
                      <span className="hidden lg:inline text-[8px] font-mono text-cyan-400 uppercase tracking-[0.2em]">
                        NEXT
                      </span>
                    )}
                    {showStreamChip ? (
                      <span className={streamChipClass}>STREAM</span>
                    ) : (
                      launchTime.chip && (
                        <span className={queueChipClass(launchTime.phase, launchTime.msUntilNet)}>
                          {launchTime.chip}
                        </span>
                      )
                    )}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2 w-full min-w-0">
                  <span
                    className={`min-w-0 flex-1 font-mono text-[11px] md:text-xs leading-tight uppercase tracking-wide sm:tracking-wider lg:tracking-widest truncate transition-colors ${selected ? "text-cyan-100 font-bold" : "text-slate-300 group-hover:text-cyan-50 group-active:text-cyan-50"}`}
                  >
                    {getLaunchTitle(launch)}
                  </span>
                  {provider && (
                    <span
                      className={`shrink-0 text-[9px] font-mono uppercase tracking-wider truncate max-w-[40%] transition-colors ${selected ? "text-cyan-500" : "text-cyan-600 group-hover:text-cyan-500 group-active:text-cyan-500"}`}
                    >
                      {provider}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Horizontal scroll affordance — stacked strip only */}
        <div
          aria-hidden
          className={`queue-strip-fade queue-strip-fade-left pointer-events-none absolute inset-y-0 left-0 z-20 lg:hidden transition-opacity duration-200 ${
            queueEdges.left ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden
          className={`queue-strip-fade queue-strip-fade-right pointer-events-none absolute inset-y-0 right-0 z-20 lg:hidden transition-opacity duration-200 ${
            queueEdges.right ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </motion.div>
  );
}
