import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import LaunchCard from './components/LaunchCard/LaunchCard';
import { LocationPanel } from './components/LocationPanel/LocationPanel';
import { ConsoleOverview } from './components/ConsoleOverview';
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
import {
  useShortViewportBand,
  type ShortViewportBand,
} from "./hooks/useShortViewportBand";
import { useConsoleScrollbarActivity } from "./hooks/useConsoleScrollbarActivity";
import { useLaunchKeyboardNav } from "./hooks/useLaunchKeyboardNav";
import { isEditableKeyboardTarget } from "./utils/queueNav";
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

/** Phone stack only (< md). md+ keeps the existing flex earth column. */
const PHONE_STACK_QUERY = "(max-width: 767px)";
/** Real hover (mouse/trackpad) — skip ghost mouse events after touch. */
const FINE_HOVER_QUERY = "(hover: hover) and (pointer: fine)";

/** Delay before hover-collapse so layout reflow doesn’t flicker pointerleave. */
const EARTH_HOVER_LEAVE_MS = 160;

/**
 * Pixel heights for the phone earth band. CSS `height` + `transform: scale`
 * animate these — Tailwind class swaps and Framer height tweens both fought
 * WebGL resize/camera refit and felt like a hard pop.
 * Short viewports still expand (pads are unusable otherwise); caps stay tighter.
 */
function phoneEarthHeightPx(
  shortBand: ShortViewportBand,
  expanded: boolean,
  viewportH: number,
): number {
  if (!expanded) {
    if (shortBand === "short") return 128; // 8rem
    return shortBand === "mid" ? 152 : 184; // 9.5rem / 11.5rem
  }
  if (shortBand === "short") return Math.min(viewportH * 0.36, 200); // ≤12.5rem
  if (shortBand === "mid") return Math.min(viewportH * 0.4, 240); // ≤15rem
  return Math.min(viewportH * 0.44, 288); // ≤18rem
}

/** Shared easing for phone earth band height + scale (keep in sync). */
const EARTH_SIZE_EASING = "0.5s cubic-bezier(0.22, 1, 0.36, 1)";

export default function App() {
  /** Idle = console overview. Default on load/refresh; cleared when a mission is selected. */
  const [inspectorIdle, setInspectorIdle] = useState(true);
  const {
    launches,
    boardUpdates,
    selectedApiId,
    setSelectedApiId,
    feedLive,
  } = useLaunchFeed({
    allowAutoSelect: !inspectorIdle,
  });
  const { locations } = useLocationFeed();
  const { cycle, hour12, setCycle } = useHourCycle();
  const sysClock = useSysClock(hour12);

  const compactMotion = useCompactMotion();
  const shortBand = useShortViewportBand();
  const [watching, setWatching] = useState(false);
  /** Catalog site open in the inspector — swaps with LaunchCard. */
  const [selectedLocationApiId, setSelectedLocationApiId] = useState<number | null>(null);
  /**
   * Phone portrait: earth band grows on engage so pads are usable, then
   * yields space back when the inspector is used. Any shortBand expands;
   * disabled only at md+ (flex column already sizes earth).
   */
  const [earthExpanded, setEarthExpanded] = useState(false);
  const [phoneStack, setPhoneStack] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(PHONE_STACK_QUERY).matches
      : false,
  );
  const [fineHover, setFineHover] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(FINE_HOVER_QUERY).matches
      : false,
  );
  const [viewportH, setViewportH] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 844,
  );
  const earthLeaveTimerRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  useConsoleScrollbarActivity();
  const cardEnterY = compactMotion ? travel.compact.cardY : travel.desktop.cardY;

  useEffect(() => {
    const stackMq = window.matchMedia(PHONE_STACK_QUERY);
    const hoverMq = window.matchMedia(FINE_HOVER_QUERY);
    const syncStack = () => setPhoneStack(stackMq.matches);
    const syncHover = () => setFineHover(hoverMq.matches);
    const syncViewport = () => setViewportH(window.innerHeight);
    syncStack();
    syncHover();
    syncViewport();
    stackMq.addEventListener("change", syncStack);
    hoverMq.addEventListener("change", syncHover);
    window.addEventListener("resize", syncViewport);
    return () => {
      stackMq.removeEventListener("change", syncStack);
      hoverMq.removeEventListener("change", syncHover);
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  const earthExpandable = compactMotion && phoneStack;

  useEffect(() => {
    if (!earthExpandable) setEarthExpanded(false);
  }, [earthExpandable]);

  useEffect(
    () => () => {
      if (earthLeaveTimerRef.current != null) {
        window.clearTimeout(earthLeaveTimerRef.current);
      }
    },
    [],
  );

  const expandEarth = useCallback(() => {
    if (!earthExpandable) return;
    if (earthLeaveTimerRef.current != null) {
      window.clearTimeout(earthLeaveTimerRef.current);
      earthLeaveTimerRef.current = null;
    }
    setEarthExpanded(true);
  }, [earthExpandable]);

  const collapseEarth = useCallback(() => {
    if (earthLeaveTimerRef.current != null) {
      window.clearTimeout(earthLeaveTimerRef.current);
      earthLeaveTimerRef.current = null;
    }
    setEarthExpanded(false);
  }, []);

  const scheduleCollapseEarth = useCallback(() => {
    if (!earthExpandable) return;
    if (earthLeaveTimerRef.current != null) {
      window.clearTimeout(earthLeaveTimerRef.current);
    }
    earthLeaveTimerRef.current = window.setTimeout(() => {
      earthLeaveTimerRef.current = null;
      setEarthExpanded(false);
    }, EARTH_HOVER_LEAVE_MS);
  }, [earthExpandable]);

  const earthCollapsedPx = phoneEarthHeightPx(shortBand, false, viewportH);
  const earthHeightPx = phoneEarthHeightPx(
    shortBand,
    earthExpanded,
    viewportH,
  );
  const earthScale = earthHeightPx / earthCollapsedPx;
  const earthHeightTransition = reduceMotion
    ? undefined
    : `height ${EARTH_SIZE_EASING}`;
  const earthScaleTransition = reduceMotion
    ? undefined
    : `transform ${EARTH_SIZE_EASING}`;
  const earthMdFlex =
    shortBand === "short" ? "md:flex-[1.55]" : "md:flex-[1.45]";

  const { bootComplete, isBooting } = useConsoleBoot(launches.length > 0);

  const nowMs = sysClock?.nowMs ?? Date.now();
  const focusIndex = useMemo(
    () => findQueueFocusIndex(launches, nowMs),
    [launches, nowMs],
  );
  const selectedIndex = useMemo(() => {
    if (!launches.length || selectedApiId == null) return -1;
    return launches.findIndex((launch) => launch.apiId === selectedApiId);
  }, [launches, selectedApiId]);

  const selectLaunch = useCallback(
    (apiId: string | null) => {
      setInspectorIdle(false);
      setSelectedLocationApiId(null);
      setSelectedApiId(apiId);
    },
    [setSelectedApiId],
  );

  const openLocation = useCallback((locationApiId: number) => {
    setWatching(false);
    setSelectedLocationApiId(locationApiId);
  }, []);

  const closeToOverview = useCallback(() => {
    setWatching(false);
    setSelectedLocationApiId(null);
    setSelectedApiId(null);
    setInspectorIdle(true);
  }, [setSelectedApiId]);

  useLaunchKeyboardNav({
    launches,
    selectedIndex,
    focusIndex,
    onSelect: selectLaunch,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableKeyboardTarget(event.target)) return;
      if (earthExpanded) {
        event.preventDefault();
        collapseEarth();
        return;
      }
      if (selectedLocationApiId == null && selectedApiId == null) return;
      event.preventDefault();
      closeToOverview();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    collapseEarth,
    closeToOverview,
    earthExpanded,
    selectedApiId,
    selectedLocationApiId,
  ]);

  const activeLaunch =
    selectedIndex >= 0 ? launches[selectedIndex] ?? null : null;
  const nextLaunch =
    focusIndex >= 0 ? launches[focusIndex] ?? null : launches[0] ?? null;
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
  /** Soft pad focus while idle — next NET, not a selected mission. */
  const softFocusLaunch = activeLaunch ?? nextLaunch;
  const launchFocus = useMemo(
    () => enrichPadFocus(padFocusFromLaunch(softFocusLaunch), globePads),
    [
      softFocusLaunch?.pad?.latitude,
      softFocusLaunch?.pad?.longitude,
      softFocusLaunch?.pad?.location?.name,
      softFocusLaunch?.pad?.name,
      softFocusLaunch?.pad?.location?.total_launch_count,
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
  /** Open dashboard from first paint — no boxed “awaiting” card on cold load. */
  const showConsoleOverview = Boolean(
    inspectorIdle && !selectedLocation && !activeLaunch,
  );

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
          onPointerDown={(event) => {
            // Canvas / R3F often swallows bubble stopPropagation — ignore
            // presses that started on the earth band so tap-expand sticks.
            if (
              event.target instanceof Element &&
              event.target.closest("[data-earth-band]")
            ) {
              return;
            }
            collapseEarth();
          }}
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
                data-earth-band=""
                className={`relative w-full shrink-0 overflow-hidden touch-manipulation md:h-full md:min-h-0 md:w-auto md:min-w-0 ${earthMdFlex}`}
                data-earth-expanded={earthExpanded ? "true" : undefined}
                style={
                  phoneStack
                    ? {
                        height: earthHeightPx,
                        transition: earthHeightTransition,
                      }
                    : undefined
                }
                onPointerEnter={(event) => {
                  // Fine pointers only — touch expands via pointerdown (tap).
                  if (fineHover && event.pointerType === "mouse") expandEarth();
                }}
                onPointerLeave={(event) => {
                  if (fineHover && event.pointerType === "mouse") {
                    scheduleCollapseEarth();
                  }
                }}
                onMouseEnter={fineHover ? expandEarth : undefined}
                onMouseLeave={fineHover ? scheduleCollapseEarth : undefined}
                onPointerDownCapture={() => {
                  // Capture runs before the canvas drag listener, so phone
                  // taps on the WebGL surface still expand the band.
                  expandEarth();
                }}
                onPointerDown={(event) => {
                  // Belt-and-suspenders when bubble still reaches the band.
                  event.stopPropagation();
                  expandEarth();
                }}
              >
                {/*
                  Phone: keep the WebGL canvas at the collapsed size and scale
                  it with CSS. Animating layout height alone reflows R3F every
                  frame (camera + setSize) and reads as a sudden size pop.
                */}
                {phoneStack ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="relative w-full"
                      style={{
                        height: earthCollapsedPx,
                        // Html location tips read --earth-scale and counter-scale.
                        ["--earth-scale" as string]: earthScale,
                        transform: `scale(${earthScale})`,
                        transition: earthScaleTransition,
                      }}
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
                  </div>
                ) : (
                  <GlobeSlot
                    maxDpr={3}
                    focus={globeFocus}
                    pads={globePads}
                    sites={globeSites}
                    onSelectPad={handleSelectPad}
                    onSelectSite={handleSelectSite}
                  />
                )}
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
          <div className={`flex w-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[width] duration-300 ease-out md:h-full md:flex-none md:shrink-0 console-scrollbar console-scrollbar-y ${
            watching
              ? "md:w-[min(100%,32rem)] xl:w-[36rem] 2xl:w-[40rem]"
              : shortBand === "short"
                ? "md:w-[18.5rem] xl:w-[24rem] 2xl:w-[32rem]"
                : "md:w-[21rem] xl:w-[24rem] 2xl:w-[32rem]"
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
                    onClose={() => {
                      // Back to mission if one was open; else console overview.
                      if (selectedApiId) {
                        setSelectedLocationApiId(null);
                        return;
                      }
                      closeToOverview();
                    }}
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
                    onClose={closeToOverview}
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
              ) : showConsoleOverview ? (
                <motion.div
                  key="console-overview"
                  className="flex h-full min-h-0 w-full flex-col"
                  initial={{ opacity: 0, y: cardEnterY }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -cardEnterY }}
                  transition={transitions.soft}
                >
                  <ConsoleOverview
                    launches={bootComplete ? launches : []}
                    locations={locations}
                    nowMs={nowMs}
                    feedLive={feedLive}
                    updates={boardUpdates}
                    arming={!bootComplete || launches.length === 0}
                    onSelectLaunch={selectLaunch}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="awaiting-telemetry"
                  className="flex h-full min-h-0 w-full flex-col justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transitions.soft}
                >
                  <motion.p
                    className="font-mono text-sm uppercase tracking-[0.3em] text-cyan-600"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Awaiting telemetry
                  </motion.p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-700">
                    {feedLive ? "Uplink live · hydrating queue" : "Arming live feed"}
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
