import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LaunchCard from './components/LaunchCard';
import { FeedStatus } from './components/FeedStatus';
import { io } from 'socket.io-client';
import { Launch } from "./types/launch";
import { getLaunchTitle } from "./utils/launchTitle";
import { getLaunchTime, type LaunchTimePhase } from "./utils/launchTime";
import { STARFIELD_COUNT, transitions, travel } from "./lib/motionTokens";
import {
  bootQueueListVariants,
  bootStageVariants,
  createBootHeaderVariants,
  createBootPanelVariants,
  createBootQueueItemVariants,
  createBootSysClockVariants,
} from "./lib/bootMotion";
import { useConsoleBoot } from "./hooks/useConsoleBoot";
import { useCompactMotion } from "./hooks/useCompactMotion";
import { useShortViewportBand } from "./hooks/useShortViewportBand";
import { useConsoleScrollbarActivity } from "./hooks/useConsoleScrollbarActivity";
import { formatLocalDate, formatLocalDateTime, formatLocalTime, getLocalUtcOffsetLabel } from "./utils/localTime";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const socket = io(API_URL);

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

const HOUR_MS = 60 * 60 * 1000;

function findQueueFocusIndex(launches: Launch[], nowMs: number): number {
  let live = -1;
  let upcoming = -1;
  for (let i = 0; i < launches.length; i++) {
    const t = getLaunchTime({
      net: launches[i].net,
      status: launches[i].status?.abbrev,
      netPrecision: launches[i].net_precision,
      now: nowMs,
    });
    if (live < 0 && t.phase === "live") live = i;
    if (upcoming < 0 && t.msUntilNet > 0 && t.phase !== "failed") upcoming = i;
  }
  return live >= 0 ? live : upcoming;
}

function pickDefaultApiId(launches: Launch[], nowMs: number = Date.now()): string | null {
  if (!launches.length) return null;
  const focus = findQueueFocusIndex(launches, nowMs);
  const idx = focus >= 0 ? focus : 0;
  return launches[idx]?.apiId ?? null;
}

function queueChipClass(phase: LaunchTimePhase, msUntilNet: number): string {
  const base =
    "shrink-0 text-[9px] md:text-[10px] leading-tight font-mono uppercase tracking-wider tabular-nums";
  switch (phase) {
    case "live":
      return `${base} text-cyan-300 font-bold [text-shadow:0_0_8px_rgba(34,211,238,0.75)]`;
    case "elapsed":
      return `${base} text-emerald-400`;
    case "hold":
    case "provisional":
      return `${base} text-amber-400`;
    case "failed":
      return `${base} text-red-400`;
    default:
      return msUntilNet <= HOUR_MS
        ? `${base} text-cyan-300`
        : `${base} text-cyan-500`;
  }
}

export default function App() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [feedLive, setFeedLive] = useState(socket.connected);
  const [sysClock, setSysClock] = useState<{
    time: string;
    date: string;
    offset: string;
    nowMs: number;
  } | null>(null);
  const [queueRevealed, setQueueRevealed] = useState(false);
  const queueScrollRef = useRef<HTMLDivElement>(null);
  const [queueEdges, setQueueEdges] = useState({ left: false, right: false });

  const syncQueueEdges = useCallback(() => {
    const el = queueScrollRef.current;
    if (!el) return;
    // Vertical sidebar at lg — no horizontal edge cues needed.
    if (window.matchMedia('(min-width: 1024px)').matches) {
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

  const compactMotion = useCompactMotion();
  const shortBand = useShortViewportBand();
  useConsoleScrollbarActivity();
  const starfield = compactMotion
    ? starfieldPool.slice(0, STARFIELD_COUNT.compact)
    : starfieldPool;

  const bootHeaderVariants = useMemo(
    () => createBootHeaderVariants(compactMotion),
    [compactMotion],
  );
  const bootSysClockVariants = useMemo(
    () => createBootSysClockVariants(compactMotion),
    [compactMotion],
  );
  const bootPanelVariants = useMemo(
    () => createBootPanelVariants(compactMotion),
    [compactMotion],
  );
  const bootQueueItemVariants = useMemo(
    () => createBootQueueItemVariants(compactMotion),
    [compactMotion],
  );
  const cardEnterY = compactMotion ? travel.compact.cardY : travel.desktop.cardY;

  const { bootComplete, isBooting } = useConsoleBoot(launches.length > 0);

  useEffect(() => {
    fetch(`${API_URL}/launches`)
      .then((res) => res.json())
      .then((data) => setLaunches(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (launches.length === 0) return;
    if (selectedApiId && launches.some((launch) => launch.apiId === selectedApiId)) {
      return;
    }
    setSelectedApiId(pickDefaultApiId(launches));
  }, [launches, selectedApiId]);

  useEffect(() => {
    if (launches.length > 0) setQueueRevealed(true);
  }, [launches]);

  useEffect(() => {
    const onConnect = () => setFeedLive(true);
    const onDisconnect = () => setFeedLive(false);

    setFeedLive(socket.connected);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('live-launch-data', (freshData) => {
      console.log('🚀 Real-time telemetry received from server!', freshData);
      setLaunches(freshData);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('live-launch-data');
    };
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setSysClock({
        date: formatLocalDate(now),
        time: formatLocalTime(now, { includeSeconds: true }),
        offset: getLocalUtcOffsetLabel(now),
        nowMs: now.getTime(),
      });
    };

    updateClock(); 
    const timer = setInterval(updateClock, 1000); 

    return () => clearInterval(timer); 
  }, []);

  useEffect(() => {
    const el = queueScrollRef.current;
    if (!el) return;

    syncQueueEdges();
    el.addEventListener('scroll', syncQueueEdges, { passive: true });
    const ro = new ResizeObserver(() => syncQueueEdges());
    ro.observe(el);
    window.addEventListener('resize', syncQueueEdges);

    return () => {
      el.removeEventListener('scroll', syncQueueEdges);
      ro.disconnect();
      window.removeEventListener('resize', syncQueueEdges);
    };
  }, [launches, queueRevealed, syncQueueEdges]);

  const nowMs = sysClock?.nowMs ?? Date.now();
  const focusIndex = useMemo(
    () => findQueueFocusIndex(launches, nowMs),
    [launches, nowMs],
  );
  const selectedIndex = useMemo(() => {
    if (!launches.length) return 0;
    const byId = launches.findIndex((launch) => launch.apiId === selectedApiId);
    if (byId >= 0) return byId;
    const focus = findQueueFocusIndex(launches, nowMs);
    return focus >= 0 ? focus : 0;
  }, [launches, selectedApiId, nowMs]);

  const activeLaunch = launches[selectedIndex];
  // Hold the detail card until boot settles so cold load feels staged
  const showLaunchCard = Boolean(activeLaunch && bootComplete);

  return (
    <div className="relative w-screen h-dvh overflow-hidden bg-[#020617] text-cyan-50 font-sans select-none flex cursor-default">
      
      {/* Space Background — boots in first */}
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
                boxShadow: star.size > 1.5 ? '0 0 6px 1px rgba(34,211,238,0.6)' : 'none'
              }}
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0891b215_1px,transparent_1px),linear-gradient(to_bottom,#0891b215_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_40%,transparent_100%)] opacity-50"></div>
      </motion.div>

      {/* MAIN CONTENT WRAPPER — soft short bands via data-short + CSS / class maps */}
      <div
        data-short={shortBand}
        className={`console-inset relative z-10 flex flex-col w-full h-full min-h-0 density-ease${
          shortBand === "short" ? " console-short" : shortBand === "mid" ? " console-short-mid" : ""
        }`}
      >

        {/* TOP NAVIGATION / HEADER — compact vertically; sys clock stays one-line when stacked */}
        <motion.header
          className={`w-full flex justify-between items-center gap-3 border-b border-cyan-900/60 relative z-20 shrink-0 density-ease ${
            shortBand === "short"
              ? "mb-1.5 pb-1.5 lg:mb-3 lg:pb-2.5"
              : shortBand === "mid"
                ? "mb-1.5 pb-2 sm:mb-2 lg:mb-3 lg:pb-2.5"
                : "mb-2 sm:mb-2.5 lg:mb-3 pb-2 sm:pb-2.5"
          }`}
          variants={bootHeaderVariants}
          initial="hidden"
          animate="show"
        >
          
          <div className="flex flex-col justify-center cursor-default min-w-0">
            <h1
              className={`font-bold text-slate-100 uppercase leading-none drop-shadow-[0_0_15px_rgba(34,211,238,0.2)] density-ease ${
                shortBand === "short"
                  ? "text-xl tracking-[0.1em] lg:text-3xl lg:tracking-[0.16em]"
                  : shortBand === "mid"
                    ? "text-[1.35rem] sm:text-[1.65rem] tracking-[0.11em] sm:tracking-[0.14em] lg:text-3xl lg:tracking-[0.16em]"
                    : "text-2xl sm:text-3xl tracking-[0.12em] sm:tracking-[0.16em]"
              }`}
            >
              Launch
              <span
                className={`text-cyan-500 ml-[0.12em] density-ease ${
                  shortBand === "short"
                    ? "tracking-[0.08em] lg:tracking-[0.1em]"
                    : "tracking-[0.08em] sm:tracking-[0.1em]"
                }`}
              >
                Ops
              </span>
            </h1>
            <p
              className={`font-mono text-cyan-400 uppercase opacity-80 leading-none ${
                shortBand === "short"
                  ? "hidden lg:block text-[10px] tracking-[0.3em] mt-1"
                  : shortBand === "mid"
                    ? "hidden sm:block text-[10px] tracking-[0.28em] sm:tracking-[0.3em] mt-1"
                    : "hidden sm:block text-[10px] tracking-[0.28em] sm:tracking-[0.32em] mt-1"
              }`}
            >
              Global Launch Tracker
            </p>
          </div>

          <motion.div
            className="flex items-center gap-2 sm:gap-2.5 bg-black/20 border border-cyan-800/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-sm backdrop-blur-md shrink-0"
            variants={bootSysClockVariants}
            initial="hidden"
            animate="show"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_5px_#22d3ee]"></span>
            </span>
            {/* Stacked / mid: single horizontal readout — no extra header height */}
            <div className="flex lg:hidden items-baseline gap-x-2 font-mono uppercase leading-none min-w-0">
              <span className="text-[9px] tracking-[0.2em] text-cyan-500 shrink-0">Sys</span>
              <span className="text-[11px] sm:text-xs tracking-[0.14em] text-cyan-100 tabular-nums whitespace-nowrap">
                {sysClock?.time ?? '—:—:—'}
              </span>
              <span className="hidden sm:inline text-[9px] tracking-[0.15em] text-cyan-500 tabular-nums whitespace-nowrap">
                {sysClock?.date ?? '—'}
              </span>
              <span className="text-[9px] tracking-widest text-cyan-600 shrink-0">
                {sysClock?.offset ?? '—'}
              </span>
            </div>
            {/* Desktop: compact two-line block, still short */}
            <div className="hidden lg:flex flex-col font-mono uppercase leading-none gap-0.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] tracking-[0.3em] text-cyan-500">Sys Time</span>
                <span className="text-[9px] tracking-widest text-cyan-500">
                  {sysClock?.offset ?? '—'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm tracking-[0.18em] text-cyan-100 tabular-nums">
                  {sysClock?.time ?? 'INITIALIZING...'}
                </span>
                <span className="text-[10px] tracking-[0.18em] text-cyan-500 tabular-nums">
                  {sysClock?.date ?? '—'}
                </span>
              </div>
            </div>
          </motion.div>
          
        </motion.header>

        {/* PANELS WRAPPER */}
        <div
          className={`flex-1 flex flex-col lg:flex-row min-h-0 w-full relative z-10 density-ease ${
            shortBand === "short"
              ? "gap-1.5 lg:gap-8"
              : shortBand === "mid"
                ? "gap-2 sm:gap-3 md:gap-4 lg:gap-8"
                : "gap-3 sm:gap-4 md:gap-6 lg:gap-8"
          }`}
        >
          
          {/* Launch Queue — horizontal strip below lg; vertical sidebar at lg+ */}
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
                  {sysClock?.offset ?? getLocalUtcOffsetLabel()}
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
              animate={queueRevealed ? 'show' : 'hidden'}
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
                const showNext =
                  isFocus && launchTime.phase !== "live";

                return (
                <motion.button
                  key={launch.apiId || index}
                  type="button"
                  variants={bootQueueItemVariants}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (launch.apiId) setSelectedApiId(launch.apiId);
                  }}
                  className={`shrink-0 snap-start w-[11rem] sm:w-[12.5rem] lg:w-full min-h-11 text-left py-2.5 px-3 lg:py-3 lg:px-4 rounded-lg border transition-[colors,opacity] duration-300 flex flex-col justify-center gap-0.5 lg:gap-1 relative overflow-clip group cursor-pointer touch-manipulation ${
                    selected
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[inset_0_0_15px_rgba(34,211,238,0.15)]'
                      : isFocus
                        ? 'bg-cyan-950/20 border-cyan-600/45 hover:bg-cyan-900/20 hover:border-cyan-700/50 active:bg-cyan-900/25 active:border-cyan-600/60'
                        : 'bg-black/20 border-cyan-900/30 hover:bg-cyan-900/20 hover:border-cyan-700/50 active:bg-cyan-900/25 active:border-cyan-600/60'
                  } ${isPast && !selected ? 'opacity-50' : 'opacity-100'}`}
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
                      {launchTime.chip && (
                        <span className={queueChipClass(launchTime.phase, launchTime.msUntilNet)}>
                          {launchTime.chip}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 w-full min-w-0">
                    <span className={`min-w-0 flex-1 font-mono text-[11px] md:text-xs leading-tight uppercase tracking-wide sm:tracking-wider lg:tracking-widest truncate transition-colors ${selected ? 'text-cyan-100 font-bold' : 'text-slate-300 group-hover:text-cyan-50 group-active:text-cyan-50'}`}>
                      {getLaunchTitle(launch)}
                    </span>
                    {provider && (
                      <span className={`shrink-0 text-[9px] font-mono uppercase tracking-wider truncate max-w-[40%] transition-colors ${selected ? 'text-cyan-500' : 'text-cyan-600 group-hover:text-cyan-500 group-active:text-cyan-500'}`}>
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

          {/* RIGHT PANEL: Main Display */}
          <div className="flex-1 w-full lg:w-auto lg:h-full min-h-0 flex flex-col max-lg:min-h-0 max-lg:overflow-y-auto max-lg:overscroll-y-contain console-scrollbar console-scrollbar-y">
            <AnimatePresence mode="wait">
              {showLaunchCard && activeLaunch ? (
                <motion.div
                  key={activeLaunch.apiId}
                  className="w-full flex flex-col max-lg:h-auto max-lg:shrink-0 lg:h-full lg:min-h-0"
                  initial={{ opacity: 0, y: cardEnterY }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -cardEnterY }}
                  transition={transitions.soft}
                >
                  <LaunchCard
                    launch={activeLaunch}
                    feedLive={feedLive}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="awaiting-telemetry"
                  className="w-full h-full flex flex-col items-center justify-center gap-4 border border-cyan-900/50 rounded-2xl bg-black/10 backdrop-blur-sm shadow-[0_0_35px_rgba(8,145,178,0.12)] px-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transitions.soft}
                >
                  <motion.p
                    className="text-cyan-600 font-mono text-sm uppercase tracking-[0.3em] text-center"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    Awaiting Telemetry Sync...
                  </motion.p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-700 text-center">
                    {feedLive
                      ? launches.length > 0
                        ? 'Telemetry locked · bringing systems online'
                        : 'Uplink live · hydrating queue'
                      : 'Arming live feed'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        
        </div>
        
      </div>
    </div>
  );
}
