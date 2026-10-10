import { lazy, Suspense, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LaunchCard from './components/LaunchCard/LaunchCard';
import { Starfield } from './components/Starfield';
import { ConsoleHeader } from './components/ConsoleHeader';
import { LaunchQueue } from './components/LaunchQueue';
import { findQueueFocusIndex } from "./utils/queueFocus";
import { transitions, travel } from "./lib/motionTokens";
import { useConsoleBoot } from "./hooks/useConsoleBoot";
import { useLaunchFeed } from "./hooks/useLaunchFeed";
import { useSysClock } from "./hooks/useSysClock";
import { useHourCycle } from "./hooks/useHourCycle";
import { useCompactMotion } from "./hooks/useCompactMotion";
import { useShortViewportBand } from "./hooks/useShortViewportBand";
import { useConsoleScrollbarActivity } from "./hooks/useConsoleScrollbarActivity";

const GlobePanel = lazy(() => import("./components/Globe/GlobePanel"));

function GlobeSlot({ maxDpr }: { maxDpr?: number }) {
  return (
    <div className="relative h-full min-h-0 w-full">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(72%,30rem)] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl"
        aria-hidden
      />
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-700">
              Aligning globe
            </p>
          </div>
        }
      >
        <GlobePanel maxDpr={maxDpr} />
      </Suspense>
    </div>
  );
}

export default function App() {
  const { launches, selectedApiId, setSelectedApiId, feedLive } = useLaunchFeed();
  const { cycle, hour12, setCycle } = useHourCycle();
  const sysClock = useSysClock(hour12);

  const compactMotion = useCompactMotion();
  const shortBand = useShortViewportBand();
  const [watching, setWatching] = useState(false);
  useConsoleScrollbarActivity();
  const cardEnterY = compactMotion ? travel.compact.cardY : travel.desktop.cardY;

  const { bootComplete, isBooting } = useConsoleBoot(launches.length > 0);

  const nowMs = sysClock?.nowMs ?? Date.now();
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
      
      <Starfield />

      {/* MAIN CONTENT WRAPPER — soft short bands via data-short + CSS / class maps */}
      <div
        data-short={shortBand}
        className={`console-inset relative z-10 flex flex-col w-full h-full min-h-0 density-ease${
          shortBand === "short" ? " console-short" : shortBand === "mid" ? " console-short-mid" : ""
        }`}
      >

        <ConsoleHeader
          sysClock={sysClock}
          shortBand={shortBand}
          hourCycle={cycle}
          onHourCycle={setCycle}
        />

        {/* PANELS WRAPPER. The console stays locked. Nothing scrolls the page. */}
        <div
          className={`console-scrollbar console-scrollbar-y relative z-10 flex w-full min-h-0 flex-1 flex-col overflow-hidden lg:flex-row density-ease ${
            shortBand === "short"
              ? "gap-1.5 lg:gap-5"
              : shortBand === "mid"
                ? "gap-2 sm:gap-3 md:gap-4 lg:gap-5"
                : "gap-3 sm:gap-4 md:gap-6 lg:gap-5"
          }`}
        >
          
          <LaunchQueue
            launches={launches}
            selectedIndex={selectedIndex}
            nowMs={nowMs}
            onSelect={setSelectedApiId}
            feedLive={feedLive}
            isBooting={isBooting}
            shortBand={shortBand}
            hour12={hour12}
          />

          {/*
            Below md the earth is a short band and the card fills the rest.
            From md until lg the earth is the left column and the card keeps its width.
            lg:contents hands both back to the desktop row, unchanged.
          */}
          <div
            className={`flex w-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row lg:contents ${
              shortBand === "short"
                ? "gap-1.5 md:gap-4"
                : shortBand === "mid"
                  ? "gap-2 md:gap-4"
                  : "gap-3 sm:gap-4 md:gap-6"
            }`}
          >
            {compactMotion && (
              <div
                className={`relative w-full shrink-0 md:h-full md:min-h-0 md:w-auto md:min-w-0 md:flex-1 ${
                  shortBand === "short"
                    ? "h-20"
                    : shortBand === "mid"
                      ? "h-[5.5rem]"
                      : "h-[7.25rem]"
                }`}
              >
                <GlobeSlot maxDpr={3} />
              </div>
            )}

            {!compactMotion && (
              <div className="relative hidden min-h-0 min-w-0 flex-1 lg:block">
                <GlobeSlot />
              </div>
            )}

          {/* Mission inspector. Narrow on desktop so the globe keeps the center. */}
          <div className={`flex w-full min-h-0 flex-1 flex-col overflow-hidden transition-[width] duration-300 ease-out md:h-full md:flex-none md:shrink-0 console-scrollbar console-scrollbar-y ${
            watching
              ? "md:w-[min(100%,34rem)] lg:w-[36rem] xl:w-[40rem]"
              : "md:w-[22.5rem] xl:w-[26rem]"
          }`}>
            <AnimatePresence mode="wait">
              {showLaunchCard && activeLaunch ? (
                <motion.div
                  key={activeLaunch.apiId}
                  className="flex h-full min-h-0 w-full flex-col"
                  initial={{ opacity: 0, y: cardEnterY }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -cardEnterY }}
                  transition={transitions.soft}
                >
                  <LaunchCard
                    launch={activeLaunch}
                    hour12={hour12}
                    onWatchingChange={setWatching}
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
    </div>
  );
}
