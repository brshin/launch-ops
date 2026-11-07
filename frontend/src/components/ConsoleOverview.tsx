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

/**
 * Kind chip colors — spread across the palette so chips read apart at a glance.
 * Live leans Go/emerald (not sky, which sat too close to New/cyan).
 */
function updateAccent(kind: ConsoleUpdate["kind"]): string {
  switch (kind) {
    case "webcast":
      return "text-emerald-400 [text-shadow:0_0_8px_rgba(52,211,153,0.45)]";
    case "scheduled":
      return "text-cyan-300";
    case "rescheduled":
      return "text-amber-400";
    case "status":
      return "text-violet-300";
    case "removed":
      return "text-slate-500";
  }
}

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

/**
 * Idle home panel — next ETA + mission, schedule snapshot, updates, composition.
 * Outer chrome does not scroll; only the updates list scrolls.
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
  /** Phone / short height: keep Updates readable — trim composition, don't side-by-side. */
  const denseComposition = compactMotion || shortBand !== "roomy";
  const providerLimit = compactMotion ? 2 : denseComposition ? 3 : 5;
  const orbitLimit = denseComposition ? 2 : 5;
  const model = useMemo(
    () => buildConsoleOverview(launches, locations, nowMs),
    [launches, locations, nowMs],
  );
  const providers = model.providers.slice(0, providerLimit);
  const orbits = model.orbits.slice(0, orbitLimit);
  const providerMax = providers[0]?.count ?? 1;
  const orbitMax = orbits[0]?.count ?? 1;

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
      className="@container relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden pt-1 font-mono sm:pt-2 xl:pt-3"
      variants={rootVariants}
      initial="hidden"
      animate="show"
    >
      {/* ETA left · mission right — reads as one bar without a box */}
      <motion.header
        variants={sectionVariants}
        className="flex min-w-0 shrink-0 items-baseline justify-between gap-3 border-b border-cyan-900/40 pb-3 sm:gap-4 sm:pb-3.5"
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
        className="mt-4 grid min-w-0 shrink-0 grid-cols-2 gap-x-4 gap-y-4 border-b border-cyan-900/30 pb-4 font-mono @[30rem]:grid-cols-4 @[30rem]:gap-x-3 sm:mt-5"
      >
        {stats.map((stat) => (
          <div
            key={stat.key}
            className={`flex min-w-0 flex-col justify-between ${
              denseComposition
                ? "min-h-[2.85rem]"
                : "min-h-[3.5rem] @[30rem]:min-h-[3.75rem]"
            }`}
          >
            <p className="text-[11px] uppercase leading-tight tracking-[0.1em] text-cyan-500 sm:text-xs sm:tracking-[0.12em]">
              {stat.label}
            </p>
            <div className="relative mt-2 min-h-[1.6rem] min-w-0">
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

      {/* Updates owns leftover height and scrolls internally — panel itself never scrolls */}
      <motion.section
        variants={sectionVariants}
        className={`mt-4 flex min-w-0 flex-1 flex-col border-b border-cyan-900/30 pb-4 sm:mt-5 sm:pb-5 ${
          compactMotion ? "min-h-[11rem]" : "min-h-[8.5rem] sm:min-h-[10rem]"
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
        <div className="relative mt-3 min-h-0 min-w-0 flex-1 overflow-hidden">
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
                className="console-scrollbar console-scrollbar-y absolute inset-0 min-w-0 space-y-1.5 overflow-y-auto overscroll-contain pr-0.5"
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
                        className="group flex w-full min-w-0 items-start gap-2.5 border-l-2 border-transparent py-1.5 pl-2.5 text-left transition-colors hover:border-cyan-600/80"
                      >
                        <span
                          className={`mt-0.5 w-[3.35rem] shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] ${updateAccent(update.kind)}`}
                        >
                          {updateKindLabel(update.kind)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-balance font-mono text-[13px] uppercase leading-snug tracking-[0.04em] text-slate-100 group-hover:text-white sm:text-sm">
                            {update.title}
                          </span>
                          <span className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-cyan-500 group-hover:text-cyan-300">
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

      {/* Composition — side-by-side on roomy desktop; stacked + trimmed on phone */}
      <motion.div
        variants={sectionVariants}
        className={`mt-4 grid min-w-0 shrink-0 gap-5 sm:mt-5 ${
          denseComposition
            ? "grid-cols-1"
            : "grid-cols-1 @[20rem]:grid-cols-2 @[20rem]:gap-5"
        }`}
      >
        <section className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-500">
            By provider
          </p>
          <div className="relative mt-3 min-w-0">
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
                <motion.ul
                  key="providers-ready"
                  className="min-w-0 space-y-2.5"
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {providers.map((row, index) => (
                    <motion.li
                      key={row.label}
                      className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_1.5rem] items-center gap-2 font-mono sm:gap-2.5"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...transitions.soft, delay: index * 0.04 }}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {row.markUrl ? (
                          <ProviderMark url={row.markUrl} />
                        ) : (
                          <span className="size-5 sm:size-6" aria-hidden />
                        )}
                        <span className="min-w-0 truncate text-[13px] uppercase tracking-[0.05em] text-cyan-100/90 sm:text-sm">
                          {row.label}
                        </span>
                      </span>
                      <div className="h-1 min-w-0 overflow-hidden bg-cyan-950/80">
                        <motion.div
                          className="h-full bg-cyan-500/70"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.max(
                              8,
                              (row.count / providerMax) * 100,
                            )}%`,
                          }}
                          transition={transitions.soft}
                        />
                      </div>
                      <span className="text-right text-xs tabular-nums text-cyan-400">
                        {row.count}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>
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

        {/* Destinations sit beside providers on desktop; on phone they steal Updates height */}
        {!arming && !compactMotion && orbits.length > 0 ? (
          <section className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-500">
              Destinations
            </p>
            <ul className="mt-3 min-w-0 space-y-2.5">
              {orbits.map((row, index) => (
                <motion.li
                  key={row.label}
                  className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_1.5rem] items-center gap-2 font-mono sm:gap-2.5"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...transitions.soft, delay: 0.08 + index * 0.04 }}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <OrbitMark label={row.label} />
                    <span className="min-w-0 truncate text-[13px] uppercase tracking-[0.04em] text-cyan-100/90 sm:text-sm">
                      {row.label}
                    </span>
                  </span>
                  <div className="h-1 min-w-0 overflow-hidden bg-cyan-950/80">
                    <motion.div
                      className="h-full bg-cyan-600/50"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.max(8, (row.count / orbitMax) * 100)}%`,
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
          </section>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
