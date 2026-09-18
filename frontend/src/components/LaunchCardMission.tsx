import { motion, type Variants } from "framer-motion";
import type { DensityChrome } from "../lib/cardDensityChrome";

const customScrollbar = "console-scrollbar console-scrollbar-y";

type LocalDateTime = {
  date: string;
  time: string;
};

interface LaunchCardMissionProps {
  chrome: DensityChrome;
  cardVariants: Variants;
  sectionVariants: Variants;
  tZero: LocalDateTime;
  localOffsetLabel: string;
  windowStart: string | null;
  windowEnd: string | null;
  padName: string;
  padLocation: string;
  missionType: string | null;
  missionOrbit: string | null;
  description: string;
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
  localOffsetLabel,
  windowStart,
  windowEnd,
  padName,
  padLocation,
  missionType,
  missionOrbit,
  description,
}: LaunchCardMissionProps) {
  return (
    <motion.div
      variants={cardVariants}
      className={`order-2 lg:order-1 w-full shrink-0 h-auto self-start lg:self-stretch lg:w-auto lg:flex-1 lg:min-w-0 lg:min-h-0 lg:h-full lg:overflow-y-auto console-scrollbar console-scrollbar-y grid grid-cols-2 content-start items-start lg:grid-rows-[auto_1fr] lg:content-stretch lg:items-stretch density-ease ${chrome.metaGap}`}
    >
      <motion.div
        variants={sectionVariants}
        className={`bg-black/40 border border-cyan-900/50 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 active:bg-cyan-950/20 active:border-cyan-500/40 transition-all duration-300 cursor-default group relative overflow-clip density-ease ${chrome.metaPad}`}
      >
        <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 group-active:bg-cyan-400 transition-colors"></div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors">
            T-Zero Target
          </h3>
          <span
            className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider shrink-0"
            title="Times shown in your local timezone"
          >
            {localOffsetLabel}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-cyan-50 font-mono tracking-wider tabular-nums">
          <span>{tZero.date}</span>
          <span className="mx-1.5 text-cyan-700">·</span>
          <span>{tZero.time}</span>
        </p>
        <p className="mt-1 sm:mt-1.5 text-[9px] sm:text-[10px] font-mono font-light text-cyan-500 uppercase tracking-wide group-hover:text-cyan-300 group-active:text-cyan-300 transition-colors">
          <span className="mr-1.5">Window</span>
          <span className="tabular-nums tracking-normal">
            {windowStart ?? "TBA"}
            {" – "}
            {windowEnd ?? "TBA"}
          </span>
        </p>
      </motion.div>
      <motion.div
        variants={sectionVariants}
        className={`bg-black/40 border border-cyan-900/50 rounded-lg hover:bg-cyan-950/20 hover:border-cyan-500/40 active:bg-cyan-950/20 active:border-cyan-500/40 transition-all duration-300 cursor-default group relative min-w-0 flex flex-col justify-center density-ease ${chrome.metaPad}`}
      >
        <div className="absolute left-0 top-0 w-[2px] h-full bg-cyan-800 group-hover:bg-cyan-400 group-active:bg-cyan-400 transition-colors group-hover:shadow-[0_0_8px_#22d3ee] group-active:shadow-[0_0_8px_#22d3ee]"></div>
        <h3 className="text-[9px] text-cyan-500 uppercase font-mono tracking-[0.2em] mb-1 group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors">
          Launch Coordinates
        </h3>
        <p className="text-[11px] sm:text-xs lg:text-[13px] text-cyan-50 font-mono tracking-wide lg:tracking-wider break-words leading-snug group-hover:text-white group-active:text-white transition-colors">
          {padName}
        </p>
        <p className="mt-1 text-[9px] sm:text-[10px] lg:text-[11px] text-cyan-500 font-mono uppercase tracking-[0.12em] lg:tracking-[0.15em] break-words leading-snug group-hover:text-cyan-300 group-active:text-cyan-300 transition-colors">
          {padLocation}
        </p>
      </motion.div>

      <motion.div
        variants={sectionVariants}
        className={`col-span-2 w-full h-auto min-h-0 self-start flex flex-col bg-black/40 border border-cyan-900/50 rounded-lg overflow-clip hover:bg-cyan-950/20 hover:border-cyan-500/40 active:bg-cyan-950/20 active:border-cyan-500/40 transition-all duration-300 group relative lg:self-stretch lg:h-full density-ease ${chrome.metaPad}`}
      >
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-800 m-2 group-hover:border-cyan-400 group-active:border-cyan-400 transition-colors pointer-events-none"></div>

        <div
          className={`flex justify-between items-center border-b border-cyan-900/50 shrink-0 gap-2 sm:gap-3 density-ease ${chrome.briefHead}`}
        >
          <h3 className="text-[10px] sm:text-xs text-cyan-500 uppercase font-mono tracking-[0.15em] leading-tight min-w-0 group-hover:text-cyan-400 group-active:text-cyan-400 transition-colors">
            Mission Brief
          </h3>
          {(missionType || missionOrbit) && (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0 flex-wrap justify-end">
              {missionType && (
                <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider max-w-[9rem] sm:max-w-none break-words px-1.5 py-0.5 border border-cyan-900/50 rounded-sm">
                  {missionType}
                </span>
              )}
              {missionOrbit && (
                <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider max-w-[9rem] sm:max-w-none break-words px-1.5 py-0.5 border border-cyan-900/50 rounded-sm">
                  {missionOrbit}
                </span>
              )}
            </div>
          )}
        </div>
        <p
          className={`text-[12px] sm:text-[13px] text-slate-300 leading-relaxed font-mono group-hover:text-cyan-50 group-active:text-cyan-50 transition-colors break-words lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 ${customScrollbar}`}
        >
          {description}
        </p>
      </motion.div>
    </motion.div>
  );
}
