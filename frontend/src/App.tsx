import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LaunchCard from './components/LaunchCard/LaunchCard';
import { LocationPanel } from './components/LocationPanel/LocationPanel';
import { Starfield } from './components/Starfield';
import { ConsoleHeader } from './components/ConsoleHeader';
import { LaunchQueue } from './components/LaunchQueue';
import { GlobeSlot } from './components/Globe/GlobeSlot';
import { findQueueFocusIndex } from "./utils/queueFocus";
import { transitions, travel } from "./lib/motionTokens";
import { useConsoleBoot } from "./hooks/useConsoleBoot";
import { useLaunchFeed } from "./hooks/useLaunchFeed";
import { useLocationFeed } from "./hooks/useLocationFeed";
import { useSysClock } from "./hooks/useSysClock";
import { useHourCycle } from "./hooks/useHourCycle";
import { useCompactMotion } from "./hooks/useCompactMotion";
import { useShortViewportBand } from "./hooks/useShortViewportBand";
import { useConsoleScrollbarActivity } from "./hooks/useConsoleScrollbarActivity";
import { useLaunchKeyboardNav } from "./hooks/useLaunchKeyboardNav";
import {
  enrichPadFocus,
  globeSitesFromLocations,
  launchesAtLocation,
  padFocusFromLaunch,
  padFocusFromLocation,
  padSitesFromLaunches,
  soonestLaunchAtPad,
  type GlobeSite,
  type PadSite,
} from "./utils/globeFocus";

export default function App() {
  const { launches, selectedApiId, setSelectedApiId, feedLive } = useLaunchFeed();
  const { locations } = useLocationFeed();
  const { cycle, hour12, setCycle } = useHourCycle();
  const sysClock = useSysClock(hour12);

  const compactMotion = useCompactMotion();
  const shortBand = useShortViewportBand();
  const [watching, setWatching] = useState(false);
  /** Catalog site open in the inspector — swaps with LaunchCard. */
  const [selectedLocationApiId, setSelectedLocationApiId] = useState<number | null>(null);
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

  const selectLaunch = useCallback(
    (apiId: string | null) => {
      setSelectedLocationApiId(null);
      setSelectedApiId(apiId);
    },
    [setSelectedApiId],
  );

  const openLocation = useCallback((locationApiId: number) => {
    setWatching(false);
    setSelectedLocationApiId(locationApiId);
  }, []);

  useLaunchKeyboardNav({
    launches,
    selectedIndex,
    onSelect: selectLaunch,
  });

  const activeLaunch = launches[selectedIndex];
  const selectedLocation = useMemo(
    () =>
      selectedLocationApiId == null
        ? null
        : locations.find((location) => location.apiId === selectedLocationApiId) ?? null,
    [locations, selectedLocationApiId],
  );
  const locationUpcoming = useMemo(
    () =>
      selectedLocation
        ? launchesAtLocation(launches, selectedLocation.apiId, nowMs)
        : [],
    [launches, selectedLocation, nowMs],
  );

  const globePads = useMemo(
    () => padSitesFromLaunches(launches, nowMs),
    [launches, nowMs],
  );
  const globeSites = useMemo(
    () => globeSitesFromLocations(locations, launches, { nowMs }),
    [locations, launches, nowMs],
  );
  const launchFocus = useMemo(
    () => enrichPadFocus(padFocusFromLaunch(activeLaunch), globePads),
    [
      activeLaunch?.pad?.latitude,
      activeLaunch?.pad?.longitude,
      activeLaunch?.pad?.location?.name,
      activeLaunch?.pad?.name,
      activeLaunch?.pad?.location?.total_launch_count,
      globePads,
    ],
  );
  const globeFocus = useMemo(() => {
    if (selectedLocation) {
      return (
        padFocusFromLocation(selectedLocation, locationUpcoming.length) ??
        launchFocus
      );
    }
    return launchFocus;
  }, [selectedLocation, locationUpcoming.length, launchFocus]);

  const handleSelectPad = useCallback(
    (pad: PadSite) => {
      // Prefer the catalog site panel when we can resolve it; else pick a launch.
      if (typeof pad.locationApiId === "number") {
        const catalog = locations.find((location) => location.apiId === pad.locationApiId);
        if (catalog) {
          openLocation(catalog.apiId);
          return;
        }
      }
      const match = soonestLaunchAtPad(launches, pad, nowMs);
      if (match) selectLaunch(match.apiId);
    },
    [locations, launches, nowMs, openLocation, selectLaunch],
  );

  const handleSelectSite = useCallback(
    (site: GlobeSite) => {
      openLocation(site.locationApiId);
    },
    [openLocation],
  );

  const showLocationPanel = Boolean(selectedLocation && bootComplete);
  const showLaunchCard = Boolean(activeLaunch && bootComplete && !selectedLocation);

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
          className={`console-scrollbar console-scrollbar-y relative z-10 flex w-full min-h-0 flex-1 flex-col overflow-hidden xl:flex-row density-ease ${
            shortBand === "short"
              ? "gap-1.5 xl:gap-5"
              : shortBand === "mid"
                ? "gap-2 sm:gap-3 md:gap-4 xl:gap-5"
                : "gap-3 sm:gap-4 md:gap-6 xl:gap-5"
          }`}
        >
          
          <LaunchQueue
            launches={launches}
            selectedIndex={selectedIndex}
            nowMs={nowMs}
            onSelect={selectLaunch}
            feedLive={feedLive}
            isBooting={isBooting}
            shortBand={shortBand}
            hour12={hour12}
          />

          {/*
            Below md: earth band above the card.
            md→xl: earth left column + fixed inspector (even on short height — stacking
            starves the card on landscape phones).
            xl:contents → desktop row (sidebar queue + centered globe).
          */}
          <div
            className={`flex w-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row xl:contents ${
              shortBand === "short"
                ? "gap-1.5 md:gap-3"
                : shortBand === "mid"
                  ? "gap-2 md:gap-4"
                  : "gap-3 sm:gap-4 md:gap-6"
            }`}
          >
            {compactMotion && (
              <div
                className={
                  shortBand === "short"
                    ? "relative w-full shrink-0 h-[7.75rem] md:h-full md:min-h-0 md:w-auto md:min-w-0 md:flex-[1.55]"
                    : shortBand === "mid"
                      ? "relative w-full shrink-0 h-[8.5rem] md:h-full md:min-h-0 md:w-auto md:min-w-0 md:flex-[1.45]"
                      : "relative w-full shrink-0 h-[10.25rem] md:h-full md:min-h-0 md:w-auto md:min-w-0 md:flex-[1.45]"
                }
              >
                <GlobeSlot
                  maxDpr={3}
                  focus={globeFocus}
                  pads={globePads}
                  sites={globeSites}
                  onSelectPad={handleSelectPad}
                  onSelectSite={handleSelectSite}
                />
              </div>
            )}

            {!compactMotion && (
              <div className="relative hidden min-h-0 min-w-0 flex-1 xl:block">
                <GlobeSlot
                  focus={globeFocus}
                  pads={globePads}
                  sites={globeSites}
                  onSelectPad={handleSelectPad}
                  onSelectSite={handleSelectSite}
                />
              </div>
            )}

          {/* Inspector: narrower on short+md so Earth keeps width when height is tight. */}
          <div className={`flex w-full min-h-0 flex-1 flex-col overflow-hidden transition-[width] duration-300 ease-out md:h-full md:flex-none md:shrink-0 console-scrollbar console-scrollbar-y ${
            watching
              ? "md:w-[min(100%,32rem)] xl:w-[36rem] 2xl:w-[40rem]"
              : shortBand === "short"
                ? "md:w-[18.5rem] xl:w-[22.5rem] 2xl:w-[26rem]"
                : "md:w-[21rem] xl:w-[22.5rem] 2xl:w-[26rem]"
          }`}>
            <AnimatePresence mode="wait">
              {showLocationPanel && selectedLocation ? (
                <motion.div
                  key={`location-${selectedLocation.apiId}`}
                  className="flex h-full min-h-0 w-full flex-col"
                  initial={{ opacity: 0, y: cardEnterY }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -cardEnterY }}
                  transition={transitions.soft}
                >
                  <LocationPanel
                    location={selectedLocation}
                    upcoming={locationUpcoming}
                    hour12={hour12}
                    onClose={() => setSelectedLocationApiId(null)}
                    onSelectLaunch={selectLaunch}
                  />
                </motion.div>
              ) : showLaunchCard && activeLaunch ? (
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
                    onOpenLocation={
                      typeof activeLaunch.pad?.location?.id === "number" &&
                      locations.some(
                        (location) =>
                          location.apiId === activeLaunch.pad?.location?.id,
                      )
                        ? openLocation
                        : undefined
                    }
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
