import { motion, type Variants } from "framer-motion";
import type { DensityChrome } from "../../lib/cardDensityChrome";
import { transitions } from "../../lib/motionTokens";
import { formatPadPlace } from "../../utils/padPlace";
import { HourCycleFade } from "../HourCycleFade";
import type { LaunchTimePhase } from "../../utils/launchTime";

/** The tile tick follows the clock: T− cyan, T+ emerald, hold amber, fail red. */
function tZeroTickClass(phase: LaunchTimePhase): string {
  switch (phase) {
    case "live":
    case "elapsed":
      return "bg-emerald-800 group-hover:bg-emerald-400 group-active:bg-emerald-400";
    case "hold":
    case "provisional":
      return "bg-amber-800 group-hover:bg-amber-400 group-active:bg-amber-400";
    case "failed":
      return "bg-red-800 group-hover:bg-red-500 group-active:bg-red-500";
    default:
      return "bg-cyan-800 group-hover:bg-cyan-400 group-active:bg-cyan-400";
  }
}

type LocalDateTime = {
  date: string;
  time: string;
};

interface LaunchCardMissionProps {
  chrome: DensityChrome;
  cardVariants: Variants;
  sectionVariants: Variants;
  tZero: LocalDateTime;
  showNetTime: boolean;
  netCaption: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  padName: string;
  padLocation: string;
  missionType: string | null;
  missionOrbit: string | null;
  description: string;
  phase: LaunchTimePhase;
  hour12: boolean;
}

/**
 * T-Zero, pad, and mission brief — including the 2-col grid that sizes them.
 * Tile stagger lives on this root; LaunchCard still owns the visual/mission row.
 */
export function LaunchCardMission({
  chrome,
  cardVariants,
  sectionVariants,
  tZero,
  showNetTime,
  netCaption,
  windowStart,
  windowEnd,
  padName,
  padLocation,
  missionType,
  missionOrbit,
  description,
  phase,
  hour12,
}: LaunchCardMissionProps) {
  const { place, site } = formatPadPlace(padLocation);
  const sameName = site?.trim().toLowerCase() === padName.trim().toLowerCase();
  const detail = site && !sameName ? `${site} · ${padName}` : padName;

  return (
    <motion.div
      layout="size"
      variants={cardVariants}
      transition={transitions.soft}
      className={`grid h-full min-h-0 w-full flex-1 grid-cols-2 content-start items-stretch overflow-hidden grid-rows-[auto_minmax(4.5rem,1fr)] density-ease ${chrome.metaGap}`}
    >
      <motion.div
        variants={sectionVariants}
        className={`h-full min-w-0 bg-black/40 border border-cyan-900/50 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 active:bg-cyan-950/20 active:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-clip density-ease ${chrome.metaPad}`}
      >
        <div className={`absolute left-0 top-0 w-[2px] h-full transition-colors ${tZeroTickClass(phase)}`}></div>
        <h3 className="text-[10px] text-cyan-600 uppercase font-mono tracking-[0.16em] mb-1 group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors lg:text-[9px] lg:tracking-[0.2em]">
          T-Zero Target
        </h3>
        <p className="min-w-0 text-slate-100 font-mono tabular-nums">
          <HourCycleFade
            cycle={hour12 ? "12" : "24"}
            className={`inline-block max-w-full ${
              hour12
                ? "text-[11px] sm:text-xs lg:text-[11px] xl:text-xs tracking-normal lg:whitespace-nowrap"
                : "text-[11px] sm:text-xs lg:text-[11px] xl:text-[13px] tracking-wide lg:tracking-wide"
            }`}
          >
            <span className="block lg:inline">{tZero.date}</span>
            {showNetTime ? (
              <>
                <span className="mx-1.5 hidden text-slate-600 lg:inline">·</span>
                <span className="block whitespace-nowrap lg:inline">{tZero.time}</span>
              </>
            ) : null}
          </HourCycleFade>
        </p>
        {windowStart && windowEnd ? (
          <p className="mt-1 sm:mt-1.5 text-[10px] font-mono font-light text-cyan-600 uppercase tracking-wide group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors">
            <span className="mr-1.5">Window</span>
            <HourCycleFade cycle={hour12 ? "12" : "24"} className="inline-block tabular-nums tracking-normal">
              {windowStart}
              {" – "}
              {windowEnd}
            </HourCycleFade>
          </p>
        ) : netCaption ? (
          <p className="mt-1 sm:mt-1.5 text-[10px] font-mono font-light text-cyan-600 uppercase tracking-wide group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors">
            {netCaption}
          </p>
        ) : null}
      </motion.div>
      <motion.div
        variants={sectionVariants}
        className={`h-full min-w-0 bg-black/40 border border-cyan-900/50 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 active:bg-cyan-950/20 active:border-cyan-500/40 transition-all duration-300 cursor-default group relative density-ease ${chrome.metaPad}`}
      >
        <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 group-active:bg-cyan-400 transition-colors group-hover:shadow-[0_0_8px_#22d3ee] group-active:shadow-[0_0_8px_#22d3ee]"></div>
        <h3 className="text-[10px] text-cyan-600 uppercase font-mono tracking-[0.16em] mb-1 group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors lg:text-[9px] lg:tracking-[0.2em]">
          Launch Site
        </h3>
        <p className="text-[11px] sm:text-xs lg:text-[11px] xl:text-xs text-slate-100 font-mono uppercase tracking-[0.04em] sm:tracking-[0.08em] lg:tracking-[0.12em] break-words leading-snug group-hover:text-white group-active:text-white transition-colors">
          {place}
        </p>
        <p className="mt-1 text-[10px] text-cyan-600 font-mono tracking-normal sm:tracking-wide break-words leading-snug group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors">
          {detail}
        </p>
      </motion.div>

      <motion.div
        variants={sectionVariants}
        className={`col-span-2 flex h-full min-h-0 w-full min-w-0 flex-col self-stretch bg-black/40 border border-cyan-900/50 rounded-lg overflow-clip hover:bg-cyan-950/20 hover:border-cyan-500/40 active:bg-cyan-950/20 active:border-cyan-500/40 transition-all duration-300 group relative density-ease ${chrome.metaPad}`}
      >
        <div
          className={`flex flex-wrap items-baseline justify-between border-b border-cyan-900/50 shrink-0 gap-x-2 gap-y-0.5 sm:gap-x-3 density-ease ${chrome.briefHead}`}
        >
          <h3 className="text-[10px] sm:text-xs text-cyan-600 uppercase font-mono tracking-[0.12em] sm:tracking-[0.15em] leading-tight shrink-0 group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors">
            Mission Brief
          </h3>
          {(missionType || missionOrbit) && (
            <p className="min-w-0 text-[10px] font-mono text-cyan-600 uppercase tracking-wide leading-snug lg:text-right lg:text-[9px] lg:tracking-wider">
              {missionType ? <span className="lg:whitespace-nowrap">{missionType}</span> : null}
              {missionType && missionOrbit ? (
                <span className="lg:whitespace-nowrap">
                  <span className="mx-1.5 text-cyan-800">·</span>
                  {missionOrbit}
                </span>
              ) : (
                missionOrbit
              )}
            </p>
          )}
        </div>
        <p
          className="min-h-0 flex-1 overflow-y-auto text-[13px] text-slate-300 leading-normal sm:leading-relaxed font-mono group-hover:text-slate-100 group-active:text-slate-100 transition-colors break-words console-scrollbar console-scrollbar-y"
        >
          {description}
        </p>
      </motion.div>
    </motion.div>
  );
}
