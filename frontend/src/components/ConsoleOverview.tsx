import { useMemo } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { Launch } from "../types/launch";
import { transitions, travel } from "../lib/motionTokens";
import { useCompactMotion } from "../hooks/useCompactMotion";
import { useCountdown } from "../hooks/useCountdown";
import { getLaunchTitle } from "../utils/launchTitle";
import { getLaunchTime } from "../utils/launchTime";
import { formatLocalDateTime } from "../utils/localTime";
import { FeedStatus } from "./FeedStatus";
import { TickingCountdown } from "./CountdownReadout";

type ConsoleOverviewProps = {
  nextLaunch: Launch | null;
  upcomingCount: number;
  feedLive: boolean;
  hour12: boolean;
  /** Cold-load / empty feed — keep the open dashboard, soften the copy. */
  arming?: boolean;
  onOpenNext: () => void;
};

const rootVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

/**
 * Idle inspector — open dashboard strip, not a nested card.
 * Arming → ready crossfades match the rest of the console soft enter.
 */
export function ConsoleOverview({
  nextLaunch,
  upcomingCount,
  feedLive,
  hour12,
  arming = false,
  onOpenNext,
}: ConsoleOverviewProps) {
  const compactMotion = useCompactMotion();
  const time = useCountdown(nextLaunch?.net ?? "2099-01-01T00:00:00.000Z");

  const launchTime = useMemo(() => {
    if (!nextLaunch?.net) return null;
    return getLaunchTime({
      net: nextLaunch.net,
      status: nextLaunch.status?.abbrev,
      netPrecision: nextLaunch.net_precision,
      now: Date.now(),
    });
  }, [nextLaunch]);

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

  /** Crossfade swap — same travel as panel/section boot. */
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

  const nextTitle = nextLaunch ? getLaunchTitle(nextLaunch) : null;
  const nextWhen = nextLaunch?.net
    ? formatLocalDateTime(nextLaunch.net, { hour12 }).label
    : null;
  const place =
    nextLaunch?.pad?.location?.name?.trim() ||
    nextLaunch?.pad?.name?.trim() ||
    null;

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
        <div className="relative min-h-[4.25rem] min-w-0 flex-1">
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
                    ? "Uplink live · hydrating queue"
                    : "Arming live feed"
                  : "Select a launch or site to inspect"}
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

      <motion.div
        variants={sectionVariants}
        className="mt-4 flex shrink-0 flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-cyan-900/30 pb-4 font-mono"
      >
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.16em] text-cyan-700">
            Upcoming
          </p>
          <div className="relative mt-1 min-h-[2rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={arming ? "upcoming-arming" : `upcoming-${upcomingCount}`}
                className="text-2xl tabular-nums tracking-wide text-slate-100"
                variants={swapVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {arming ? "—" : upcomingCount}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <div
          className="hidden h-8 w-px bg-cyan-900/40 sm:block"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.16em] text-cyan-700">
            Uplink
          </p>
          <p
            className={`mt-1 text-sm uppercase tracking-[0.12em] ${
              feedLive ? "text-emerald-400/90" : "text-amber-400/90"
            }`}
          >
            {feedLive ? "Live" : "Offline"}
          </p>
        </div>
      </motion.div>

      <motion.section
        variants={sectionVariants}
        className="mt-4 flex min-h-0 flex-1 flex-col"
      >
        <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-700">
          Next
        </p>
        <div className="relative mt-3 min-h-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            {arming ? (
              <motion.p
                key="next-arming"
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
                  Syncing schedule…
                </motion.span>
              </motion.p>
            ) : nextLaunch && nextTitle && nextWhen && launchTime ? (
              <motion.button
                key={`next-${nextLaunch.apiId}`}
                type="button"
                onClick={onOpenNext}
                className="group absolute inset-0 flex min-h-0 w-full flex-col items-start gap-3 border-l-2 border-cyan-800/70 pl-3 text-left transition-colors hover:border-cyan-400/80"
                variants={swapVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="min-w-0 w-full">
                  <p className="truncate font-mono text-base uppercase tracking-[0.06em] text-slate-100 group-hover:text-white sm:text-lg">
                    {nextTitle}
                  </p>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-600 group-hover:text-cyan-400">
                    {nextWhen}
                    {place ? ` · ${place}` : ""}
                  </p>
                </div>
                {launchTime.phase === "hold" ? (
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-400">
                    Hold
                  </p>
                ) : launchTime.phase === "failed" ? (
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-red-400">
                    Failed
                  </p>
                ) : launchTime.phase === "provisional" ||
                  !launchTime.preciseEnough ? (
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-500/90">
                    Net · Provisional
                  </p>
                ) : (
                  <TickingCountdown
                    days={time.days}
                    hours={time.hours}
                    minutes={time.minutes}
                    seconds={time.seconds}
                    difference={time.difference}
                    mode={launchTime.phase === "countdown" ? "minus" : "plus"}
                  />
                )}
                <span className="mt-auto pt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-700 transition-colors group-hover:text-cyan-400">
                  Open mission →
                </span>
              </motion.button>
            ) : (
              <motion.p
                key="next-empty"
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-800"
                variants={swapVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                No upcoming NET in queue
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </motion.div>
  );
}
