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
import { formatLocalDateTime } from "../utils/localTime";
import { HourCycleFade } from "./HourCycleFade";

const HOUR_MS = 60 * 60 * 1000;

const queueChipBase =
  "shrink-0 text-[9px] md:text-[10px] leading-tight font-mono uppercase tracking-wider tabular-nums";

/** STREAM / live — emerald (same signal as console Live; not sky). */
const streamChipClass = `${queueChipBase} text-emerald-400 font-bold [text-shadow:0_0_8px_rgba(52,211,153,0.55)]`;

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
        : `${queueChipBase} text-cyan-400`;
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
  hour12: boolean;
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
  hour12,
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

  // Keep the active row in the strip / sidebar after click or arrow select.
  useEffect(() => {
    const root = queueScrollRef.current;
    if (!root) return;
    const selected = root.querySelector<HTMLElement>('[data-queue-selected="true"]');
    selected?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  return (
    <motion.div
      className="w-full xl:w-[300px] 2xl:w-[320px] h-auto shrink-0 xl:h-full xl:min-h-0 flex flex-col bg-black/10 backdrop-blur-sm border border-cyan-900/50 rounded-2xl shadow-[0_0_35px_rgba(8,145,178,0.12)] overflow-clip"
      variants={bootPanelVariants}
      initial="hidden"
      animate="show"
    >
      <div
        className={`border-b border-cyan-800/50 bg-black/30 flex justify-between items-center shadow-lg z-20 shrink-0 gap-2 xl:gap-3 density-ease ${
          shortBand === "short"
            ? "px-2 py-1 xl:p-4"
            : shortBand === "mid"
              ? "px-2.5 py-1.5 xl:p-4"
              : "px-2.5 py-1.5 md:px-3 md:py-2 xl:p-4"
        }`}
      >
        <h2
          className={`text-cyan-500 font-mono uppercase min-w-0 truncate density-ease ${
            shortBand === "short"
              ? "tracking-[0.15em] text-[9px] xl:tracking-[0.25em] xl:text-xs"
              : shortBand === "mid"
                ? "tracking-[0.17em] text-[9px] sm:text-[10px] xl:tracking-[0.25em] xl:text-xs"
                : "tracking-[0.2em] xl:tracking-[0.25em] text-[10px] xl:text-xs"
          }`}
        >
          Launch Queue
        </h2>
        <FeedStatus
          live={feedLive}
          arming={isBooting && !feedLive}
          quietLive
          liveLabel="Feed Live"
          offlineLabel="Feed Offline"
          armingLabel="Arming Feed"
          className="shrink-0 text-[9px]"
        />
      </div>

      <div className="relative min-h-0 xl:flex-1 xl:min-h-0 flex flex-col">
        <motion.div
          ref={queueScrollRef}
          className={`console-scrollbar console-scrollbar-y queue-sidebar-scroll relative z-10 flex flex-row overflow-x-auto overflow-y-hidden snap-x snap-mandatory xl:flex-1 xl:flex-col xl:overflow-y-auto xl:overflow-x-hidden xl:snap-none overscroll-x-contain xl:overscroll-y-contain density-ease ${
            shortBand === "short"
              ? "gap-1 p-1 max-xl:pr-6 xl:gap-2 xl:p-3"
              : shortBand === "mid"
                ? "gap-1.5 p-2 max-xl:pr-7 xl:gap-2 xl:p-3"
                : "gap-1.5 p-2 max-md:pr-6 md:gap-2 md:p-2.5 md:max-xl:pr-8 xl:p-3"
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
                data-queue-selected={selected ? "true" : undefined}
                onClick={() => {
                  if (launch.apiId) onSelect(launch.apiId);
                }}
                className={`relative flex min-h-10 shrink-0 snap-start flex-col justify-center gap-0 overflow-clip rounded-lg border px-2.5 py-1.5 text-left transition-[width,colors,opacity] duration-300 ease-out touch-manipulation group cursor-pointer md:min-h-11 md:gap-0.5 md:px-3 md:py-2.5 xl:w-full xl:gap-1 xl:px-3 xl:py-3 ${
                  hour12 ? "w-[14rem] md:w-[17.5rem]" : "w-[13rem] md:w-[14rem]"
                } ${
                  selected
                    ? "bg-cyan-950/40 border-cyan-500/60 shadow-[inset_0_0_15px_rgba(34,211,238,0.15)]"
                    : isFocus
                      ? "bg-cyan-950/20 border-cyan-600/45 hover:bg-cyan-900/20 hover:border-cyan-700/50 active:bg-cyan-900/25 active:border-cyan-600/60"
                      : "bg-black/20 border-cyan-900/30 hover:bg-cyan-900/20 hover:border-cyan-700/50 active:bg-cyan-900/25 active:border-cyan-600/60"
                } ${isPast && !selected ? "opacity-50" : "opacity-100"}`}
              >
                {/*
                  Equal xl:px-3 on both sides. Accent overlays the left pad so
                  date/chip share the same inset from the card edge.
                */}
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      key="selected-bar"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee] xl:inset-x-auto xl:left-0 xl:top-0 xl:bottom-0 xl:h-auto xl:w-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={transitions.snappy}
                    />
                  )}
                </AnimatePresence>

                <div className="flex w-full min-w-0 items-baseline justify-between gap-1.5">
                  <HourCycleFade
                    cycle={hour12 ? "12" : "24"}
                    className={`inline-block min-w-0 max-w-full truncate text-[11px] md:text-xs leading-tight font-mono tabular-nums ${hour12 ? "tracking-[0.04em]" : "tracking-[0.12em]"} ${selected ? "font-medium text-slate-100" : "text-slate-300"}`}
                  >
                    {formatLocalDateTime(launch.net, { includeYear: false, hour12 }).label}
                  </HourCycleFade>
                  <span className="flex shrink-0 items-baseline justify-end gap-1.5 text-right">
                    {showNext && (
                      <span className="hidden xl:inline text-[8px] font-mono text-cyan-600 uppercase tracking-[0.2em]">
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

                <div className="flex w-full min-w-0 items-baseline justify-between gap-2">
                  <span
                    className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase leading-tight tracking-wide text-cyan-600 md:text-xs"
                  >
                    {getLaunchTitle(launch)}
                  </span>
                  {provider && (
                    <span
                      className="max-w-[40%] shrink-0 truncate text-right text-[10px] font-mono uppercase tracking-wider text-zinc-500 transition-colors group-hover:text-zinc-400 group-active:text-zinc-400"
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
          className={`queue-strip-fade queue-strip-fade-left pointer-events-none absolute inset-y-0 left-0 z-20 xl:hidden transition-opacity duration-200 ${
            queueEdges.left ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden
          className={`queue-strip-fade queue-strip-fade-right pointer-events-none absolute inset-y-0 right-0 z-20 xl:hidden transition-opacity duration-200 ${
            queueEdges.right ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </motion.div>
  );
}
