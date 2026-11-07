import { useMemo } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { Launch } from "../types/launch";
import type { LaunchLocation } from "../types/location";
import { transitions, travel } from "../lib/motionTokens";
import { useCompactMotion } from "../hooks/useCompactMotion";
import { buildConsoleOverview } from "../utils/consoleOverview";
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
  /** Server-owned board change log (REST hydrate + socket append). */
  updates?: ConsoleUpdate[];
  /** Cold-load / empty feed — keep the open dashboard, soften the copy. */
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

function updateAccent(kind: ConsoleUpdate["kind"]): string {
  switch (kind) {
    case "webcast":
      return "text-emerald-400 border-emerald-700/50";
    case "scheduled":
      return "text-cyan-300 border-cyan-700/50";
    case "rescheduled":
      return "text-amber-300 border-amber-700/40";
    case "status":
      return "text-slate-200 border-slate-600/50";
    case "removed":
      return "text-slate-500 border-slate-700/40";
  }
}

/**
 * Idle home console — board summary + live change feed.
 * Does not repeat queue missions, countdowns, or header clock.
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
  const model = useMemo(
    () => buildConsoleOverview(launches, locations, nowMs),
    [launches, locations, nowMs],
  );

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

  const providerMax = model.providers[0]?.count ?? 1;

  const stats = [
    {
      key: "upcoming",
      label: "Upcoming",
      value: arming ? "—" : String(model.upcomingCount),
    },
    {
      key: "week",
      label: "Next 7 days",
      value: arming ? "—" : String(model.weekCount),
    },
    {
      key: "sites",
      label: "Pads lit",
      value: arming ? "—" : String(model.sitesLit),
    },
    {
      key: "streams",
      label: "Webcasts",
      value: arming ? "—" : String(model.streamingCount),
      accent: !arming && model.streamingCount > 0,
    },
  ] as const;

  return (
    <motion.div
      data-inspector="console"
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden"
      variants={rootVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header
        variants={sectionVariants}
        className="flex shrink-0 items-end justify-between gap-3 border-b border-cyan-900/40 pb-3"
      >
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-600">
            Console
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={arming ? "arming-copy" : "ready-copy"}
              className="mt-1.5"
              variants={swapVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <h2 className="font-mono text-lg uppercase tracking-[0.06em] text-slate-100 sm:text-xl">
                {arming ? "Bringing systems online" : "Systems nominal"}
              </h2>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-700">
                {arming
                  ? feedLive
                    ? "Uplink live · hydrating board"
                    : "Arming live feed"
                  : model.pulse}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        <FeedStatus
          live={feedLive}
          arming={arming && !feedLive}
          quietLive
          liveLabel="Feed Live"
          offlineLabel="Feed Offline"
          armingLabel="Arming Feed"
          className="shrink-0 pb-0.5 text-[9px]"
        />
      </motion.header>

      <div className="console-scrollbar console-scrollbar-y mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-0.5">
        {/* Live change feed — hero of the home console */}
        <motion.section variants={sectionVariants} className="shrink-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-700">
            Updates
          </p>
          <div className="relative mt-2 min-h-[6.5rem]">
            <AnimatePresence mode="wait" initial={false}>
              {arming ? (
                <motion.p
                  key="updates-arming"
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-700"
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
                    Listening for board changes…
                  </motion.span>
                </motion.p>
              ) : updates.length > 0 ? (
                <motion.ul
                  key="updates-list"
                  className="space-y-0.5"
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
                          className="group flex w-full items-start gap-2 border-l-2 border-transparent py-1.5 pl-2.5 text-left transition-colors hover:border-cyan-700/70"
                        >
                          <span
                            className={`mt-0.5 w-12 shrink-0 border-b border-transparent font-mono text-[9px] uppercase tracking-[0.12em] ${updateAccent(update.kind)}`}
                          >
                            {updateKindLabel(update.kind)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-mono text-[11px] uppercase tracking-[0.06em] text-slate-200 group-hover:text-white">
                              {update.title}
                            </span>
                            <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-cyan-700 group-hover:text-cyan-500">
                              {update.detail}
                              <span className="text-cyan-900">
                                {" · "}
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
                <motion.div
                  key="updates-empty"
                  className="border-l-2 border-cyan-900/40 pl-3"
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400">
                    No recent changes
                  </p>
                  <p className="mt-1.5 font-mono text-[10px] leading-relaxed tracking-[0.04em] text-cyan-800">
                    When the board moves — new launches, time slips, status
                    changes, live webcasts — they land here for every visitor.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Clear board stats */}
        <motion.div
          variants={sectionVariants}
          className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-3 border-y border-cyan-900/30 py-3 font-mono sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.key} className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.16em] text-cyan-700">
                {stat.label}
              </p>
              <div className="relative mt-1 min-h-[1.75rem]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={`${stat.key}-${stat.value}`}
                    className={`text-xl tabular-nums tracking-wide sm:text-2xl ${
                      "accent" in stat && stat.accent
                        ? "text-emerald-400"
                        : "text-slate-100"
                    }`}
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

        {/* Provider mix */}
        <motion.section variants={sectionVariants} className="shrink-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-700">
            Providers on the board
          </p>
          <div className="relative mt-2.5 min-h-[4.5rem]">
            <AnimatePresence mode="wait" initial={false}>
              {arming ? (
                <motion.p
                  key="providers-arming"
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-700"
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  Syncing…
                </motion.p>
              ) : model.providers.length > 0 ? (
                <motion.ul
                  key="providers-ready"
                  className="space-y-2"
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {model.providers.map((row) => (
                    <li
                      key={row.label}
                      className="grid grid-cols-[2.75rem_1fr_1.5rem] items-center gap-2 font-mono"
                    >
                      <span className="truncate text-[11px] uppercase tracking-[0.08em] text-slate-200">
                        {row.label}
                      </span>
                      <div className="h-1 overflow-hidden bg-cyan-950/80">
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
                      <span className="text-right text-[10px] tabular-nums text-cyan-500">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </motion.ul>
              ) : (
                <motion.p
                  key="providers-empty"
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-800"
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  No providers yet
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Orbits — plain language, no rotating jargon */}
        {!arming && model.orbits.length > 0 ? (
          <motion.section variants={sectionVariants} className="shrink-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-700">
              Target orbits
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-slate-300">
              {model.orbits
                .map((row) => `${row.label} ${row.count}`)
                .join(" · ")}
            </p>
          </motion.section>
        ) : null}

        {/* Quiet catalog footprint — counts only, no lifetime tables */}
        {!arming && model.earthActive > 0 ? (
          <motion.p
            variants={sectionVariants}
            className="shrink-0 pb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-900"
          >
            Catalog · {model.earthActive} active Earth sites
            {model.lunarSites > 0 ? ` · ${model.lunarSites} lunar` : ""}
          </motion.p>
        ) : null}
      </div>
    </motion.div>
  );
}
