import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { Launch } from "../types/launch";
import type { LaunchLocation } from "../types/location";
import { transitions, travel } from "../lib/motionTokens";
import { useCompactMotion } from "../hooks/useCompactMotion";
import { useShortViewportBand } from "../hooks/useShortViewportBand";
import { prepareAgencyMark } from "../utils/agencyMarkImage";
import {
  buildConsoleOverview,
  formatNextLaunchHeadline,
} from "../utils/consoleOverview";
import { getLaunchTitle } from "../utils/launchTitle";
import { consoleUpdateAccent } from "../lib/signalColors";
import {
  formatUpdateAge,
  updateKindLabel,
  type ConsoleUpdate,
} from "../utils/consoleUpdates";
import { FeedStatus } from "./FeedStatus";

type ConsoleOverviewProps = {
  launches: Launch[];
  locations: LaunchLocation[];
  nowMs: number;
  feedLive: boolean;
  updates?: ConsoleUpdate[];
  arming?: boolean;
  onSelectLaunch: (apiId: string) => void;
};

const rootVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.06,
    },
  },
};

function ProviderMark({ url }: { url: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancel = false;
    setHidden(false);
    setSrc(null);
    prepareAgencyMark(url).then((next) => {
      if (cancel) return;
      if (!next) setHidden(true);
      else setSrc(next);
    });
    return () => {
      cancel = true;
    };
  }, [url]);

  if (hidden) return null;
  return (
    <span
      className={`inline-flex size-5 shrink-0 items-center justify-center sm:size-6 ${src ? "" : "invisible"}`}
    >
      {src ? (
        <img src={src} alt="" draggable={false} className="size-full object-contain" />
      ) : null}
    </span>
  );
}

/** Tiny destination glyph so Destinations mirrors provider marks. */
function OrbitMark({ label }: { label: string }) {
  const kind = label.toLowerCase();
  const isLeo = kind.includes("low earth") || kind === "leo";
  const isGeo = kind.includes("geo") || kind.includes("gto");
  const isPolar = kind.includes("sun") || kind.includes("polar") || kind.includes("sso");

  return (
    <span
      className="inline-flex size-5 shrink-0 items-center justify-center text-cyan-500/80 sm:size-6"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[70%] fill-none stroke-current stroke-[1.5]">
        <circle cx="12" cy="12" r="3.25" className="fill-cyan-400/25 stroke-cyan-400/90" />
        {isLeo ? (
          <ellipse cx="12" cy="12" rx="8.5" ry="5" />
        ) : isGeo ? (
          <>
            <ellipse cx="12" cy="12" rx="9" ry="4.25" />
            <circle cx="12" cy="12" r="7.25" className="opacity-50" />
          </>
        ) : isPolar ? (
          <ellipse cx="12" cy="12" rx="5" ry="9" />
        ) : (
          <ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-28 12 12)" />
        )}
      </svg>
    </span>
  );
}

type RankRow = {
  label: string;
  count: number;
  markUrl?: string | null;
};

function RankList({
  rows,
  max,
  kind,
}: {
  rows: RankRow[];
  max: number;
  kind: "provider" | "orbit";
}) {
  return (
    <ul className="min-w-0 space-y-2">
      {rows.map((row, index) => (
        <motion.li
          key={row.label}
          className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_1.5rem] items-center gap-2 font-mono sm:gap-2.5"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...transitions.soft, delay: index * 0.04 }}
        >
          <span className="flex min-w-0 items-center gap-2">
            {kind === "provider" ? (
              row.markUrl ? (
                <ProviderMark url={row.markUrl} />
              ) : (
                <span className="size-5 sm:size-6" aria-hidden />
              )
            ) : (
              <OrbitMark label={row.label} />
            )}
            <span className="min-w-0 truncate text-[13px] uppercase tracking-[0.04em] text-cyan-100/90 sm:text-sm">
              {row.label}
            </span>
          </span>
          <div className="h-1 min-w-0 overflow-hidden bg-cyan-950/80">
            <motion.div
              className={`h-full ${kind === "provider" ? "bg-cyan-500/70" : "bg-cyan-600/50"}`}
              initial={{ width: 0 }}
              animate={{
                width: `${Math.max(8, (row.count / max) * 100)}%`,
              }}
              transition={transitions.soft}
            />
          </div>
          <span className="text-right text-xs tabular-nums text-cyan-400">
            {row.count}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

/**
 * Idle home panel — next ETA + mission, schedule snapshot, updates, composition.
 *
 * Layout contract:
 * - Outer chrome never scrolls; only Recent updates scrolls.
 * - CSS grid rows: auto / auto / minmax(updates) / auto so providers +
 *   destinations always keep a seat; Updates flexes with leftover height.
 * - Side-by-side composition when the inspector container is ≥20rem (typical
 *   phone console width) — that saves vertical space vs stacking.
 * - Short height only trims row counts, never drops a whole section.
 */
export function ConsoleOverview({
  launches,
  locations,
  nowMs,
  feedLive,
  updates = [],
  arming = false,
  onSelectLaunch,
}: ConsoleOverviewProps) {
  const compactMotion = useCompactMotion();
  const shortBand = useShortViewportBand();
  const tight = shortBand !== "roomy";

  /*
    Always keep both composition sections. Trim row counts only:
    - short height → leanest bars (side-by-side still)
    - phone / mid shell → moderate
    - desktop roomy → full top-5
  */
  const providerLimit =
    shortBand === "short" ? 2 : compactMotion || tight ? 3 : 5;
  const orbitLimit =
    shortBand === "short" ? 2 : compactMotion || tight ? 3 : 5;

  const model = useMemo(
    () => buildConsoleOverview(launches, locations, nowMs),
    [launches, locations, nowMs],
  );
  const providers = model.providers.slice(0, providerLimit);
  const orbits = model.orbits.slice(0, orbitLimit);
  const providerMax = providers[0]?.count ?? 1;
  const orbitMax = orbits[0]?.count ?? 1;
  const showDestinations = !arming && orbits.length > 0;

  const headline = useMemo(() => {
    if (arming) {
      return {
        lead: feedLive ? "Loading" : "Connecting",
        emphasis: feedLive ? "schedule…" : "…",
      };
    }
    return formatNextLaunchHeadline(model.nextLaunch, nowMs);
  }, [arming, feedLive, model.nextLaunch, nowMs]);

  const nextTitle = useMemo(() => {
    if (arming || !model.nextLaunch) return null;
    return getLaunchTitle(model.nextLaunch);
  }, [arming, model.nextLaunch]);

  const nextProvider = useMemo(() => {
    if (!model.nextLaunch) return null;
    return (
      model.nextLaunch.launch_service_provider?.abbrev?.trim() ||
      model.nextLaunch.launch_service_provider?.name?.trim() ||
      null
    );
  }, [model.nextLaunch]);

  const y = compactMotion ? travel.compact.sectionY : travel.desktop.sectionY;

  const sectionVariants: Variants = useMemo(
    () => ({
      hidden: { opacity: 0, y },
      show: {
        opacity: 1,
        y: 0,
        transition: transitions.soft,
      },
    }),
    [y],
  );

  const swapVariants: Variants = useMemo(
    () => ({
      initial: { opacity: 0, y },
      animate: {
        opacity: 1,
        y: 0,
        transition: transitions.soft,
      },
      exit: {
        opacity: 0,
        y: -y * 0.5,
        transition: transitions.snappy,
      },
    }),
    [y],
  );

  const stats = [
    {
      key: "upcoming",
      label: "Upcoming",
      value: arming ? "—" : String(model.upcomingCount),
    },
    {
      key: "week",
      label: "This week",
      value: arming ? "—" : String(model.weekCount),
    },
    {
      key: "sites",
      label: "Sites",
      value: arming ? "—" : String(model.sitesLit),
    },
    {
      key: "lifetime",
      label: "All launches",
      value: arming
        ? "—"
        : model.lifetimeAttempts.toLocaleString("en-US"),
    },
  ] as const;

  return (
    <motion.div
      data-inspector="console"
      className={`@container relative grid h-full min-h-0 w-full min-w-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden font-mono ${
        tight ? "gap-0 pt-0.5" : "pt-1 sm:pt-2 xl:pt-3"
      }`}
      variants={rootVariants}
      initial="hidden"
      animate="show"
    >
      {/* ETA left · mission right — reads as one bar without a box */}
      <motion.header
        variants={sectionVariants}
        className={`flex min-w-0 items-baseline justify-between gap-3 border-b border-cyan-900/40 ${
          tight ? "pb-2.5" : "pb-3 sm:gap-4 sm:pb-3.5"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {headline ? (
            <motion.p
              key={`${headline.lead}-${headline.emphasis}`}
              className="min-w-0 shrink font-mono text-[11px] uppercase leading-snug tracking-[0.12em] text-cyan-500 sm:text-xs sm:tracking-[0.14em]"
              variants={swapVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <span>{headline.lead}</span>{" "}
              <span className="font-bold tracking-[0.08em] text-cyan-300 tabular-nums text-shadow-[0_0_12px_rgba(34,211,238,0.25)] sm:text-[0.95rem]">
                {headline.emphasis}
              </span>
            </motion.p>
          ) : (
            <motion.p
              key="headline-empty"
              className="min-w-0 shrink font-mono text-xs uppercase tracking-[0.14em] text-cyan-700"
              variants={swapVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              No upcoming launch
            </motion.p>
          )}
        </AnimatePresence>

        {nextTitle && model.nextLaunch ? (
          <button
            type="button"
            onClick={() => onSelectLaunch(model.nextLaunch!.apiId)}
            className="group min-w-0 max-w-[55%] text-right font-mono text-[11px] uppercase leading-snug tracking-[0.08em] text-slate-300 transition-colors hover:text-cyan-200 sm:max-w-[60%] sm:text-xs"
          >
            {nextProvider ? (
              <span className="text-cyan-600 group-hover:text-cyan-400">
                {nextProvider}
                <span className="mx-1.5 text-cyan-800">·</span>
              </span>
            ) : null}
            <span className="text-balance text-slate-200 group-hover:text-white">
              {nextTitle}
            </span>
          </button>
        ) : null}
      </motion.header>

      {/*
        Stats stay 2×2 until labels like “All launches” fit in 4-up.
        Parent overflow-hidden would otherwise clip the last column.
      */}
      <motion.div
        variants={sectionVariants}
        className={`grid min-w-0 grid-cols-2 gap-x-4 border-b border-cyan-900/30 font-mono @[30rem]:grid-cols-4 @[30rem]:gap-x-3 ${
          tight
            ? "mt-3 gap-y-3 pb-3"
            : "mt-4 gap-y-4 pb-4 sm:mt-5"
        }`}
      >
        {stats.map((stat) => (
          <div
            key={stat.key}
            className={`flex min-w-0 flex-col justify-between ${
              tight
                ? "min-h-[2.5rem]"
                : "min-h-[3.5rem] @[30rem]:min-h-[3.75rem]"
            }`}
          >
            <p className="text-[11px] uppercase leading-tight tracking-[0.1em] text-cyan-500 sm:text-xs sm:tracking-[0.12em]">
              {stat.label}
            </p>
            <div className="relative mt-1.5 min-h-[1.4rem] min-w-0 sm:mt-2 sm:min-h-[1.6rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={`${stat.key}-${stat.value}`}
                  className="truncate text-xl leading-none tabular-nums tracking-wide text-cyan-50 sm:text-2xl"
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {stat.value}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        ))}
      </motion.div>

      {/*
        Updates = the flexible middle row. Modest minmax floor (~1–2 rows) so
        composition always fits; leftover height scrolls inside the list.
      */}
      <motion.section
        variants={sectionVariants}
        className={`flex min-h-0 min-w-0 flex-col border-b border-cyan-900/30 ${
          tight ? "mt-3 pb-3" : "mt-4 pb-4 sm:mt-5 sm:pb-5"
        }`}
      >
        <div className="flex min-w-0 shrink-0 items-baseline justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-500">
            Recent updates
          </p>
          <FeedStatus
            live={feedLive}
            arming={arming && !feedLive}
            quietLive
            liveLabel="Feed Live"
            offlineLabel="Feed Offline"
            armingLabel="Arming"
            className="shrink-0 text-[10px]"
          />
        </div>
        <div className="relative mt-2.5 min-h-0 min-w-0 flex-1 overflow-hidden sm:mt-3">
          <AnimatePresence mode="wait" initial={false}>
            {arming ? (
              <motion.p
                key="updates-arming"
                className="font-mono text-xs uppercase tracking-[0.12em] text-cyan-500"
                variants={swapVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.span
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  Loading recent updates…
                </motion.span>
              </motion.p>
            ) : updates.length > 0 ? (
              <motion.ul
                key="updates-list"
                className="console-scrollbar console-scrollbar-y absolute inset-0 min-w-0 space-y-1 overflow-y-auto overscroll-contain pr-0.5 sm:space-y-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AnimatePresence initial={false}>
                  {updates.map((update) => (
                    <motion.li
                      key={update.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={transitions.soft}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectLaunch(update.apiId)}
                        className={`group flex w-full min-w-0 items-start gap-2.5 border-l-2 border-transparent pl-2.5 text-left transition-colors hover:border-cyan-600/80 ${
                          tight ? "py-1" : "py-1.5"
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-[3.35rem] shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] ${consoleUpdateAccent(update.kind)}`}
                        >
                          {updateKindLabel(update.kind)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-balance font-mono text-[13px] uppercase leading-snug tracking-[0.04em] text-slate-100 group-hover:text-white sm:text-sm">
                            {update.title}
                          </span>
                          <span className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-cyan-500 group-hover:text-cyan-300 sm:mt-1">
                            <span className="min-w-0 text-balance text-cyan-400">
                              {update.detail}
                            </span>
                            <span className="text-cyan-700" aria-hidden>
                              ·
                            </span>
                            <span className="shrink-0 tabular-nums text-cyan-500">
                              {formatUpdateAge(update.atMs, nowMs)}
                            </span>
                          </span>
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            ) : (
              <motion.p
                key="updates-empty"
                className="border-l-2 border-cyan-900/40 pl-3 font-mono text-[13px] uppercase tracking-[0.08em] text-cyan-600"
                variants={swapVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                Schedule quiet
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/*
        Composition always reserved (auto row). When destinations exist,
        always share one horizontal band — stacking doubles the height tax
        and is what used to force-drop Destinations on phone/short.
      */}
      <motion.div
        variants={sectionVariants}
        className={`grid min-w-0 ${
          showDestinations ? "grid-cols-2" : "grid-cols-1"
        } ${tight ? "mt-3 gap-3" : "mt-4 gap-4 sm:mt-5 sm:gap-5"}`}
      >
        <section className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-500">
            By provider
          </p>
          <div className="relative mt-2.5 min-w-0 sm:mt-3">
            <AnimatePresence mode="wait" initial={false}>
              {arming ? (
                <motion.p
                  key="providers-arming"
                  className="font-mono text-xs uppercase tracking-[0.12em] text-cyan-500"
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  Syncing…
                </motion.p>
              ) : providers.length > 0 ? (
                <motion.div
                  key="providers-ready"
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <RankList rows={providers} max={providerMax} kind="provider" />
                </motion.div>
              ) : (
                <motion.p
                  key="providers-empty"
                  className="font-mono text-xs uppercase tracking-[0.12em] text-cyan-600"
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  No providers in the queue
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        {showDestinations ? (
          <section className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-500">
              Destinations
            </p>
            <div className="mt-2.5 min-w-0 sm:mt-3">
              <RankList rows={orbits} max={orbitMax} kind="orbit" />
            </div>
          </section>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
