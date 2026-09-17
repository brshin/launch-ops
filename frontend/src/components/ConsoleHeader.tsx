import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  createBootHeaderVariants,
  createBootSysClockVariants,
} from "../lib/bootMotion";
import { useCompactMotion } from "../hooks/useCompactMotion";
import type { ShortViewportBand } from "../hooks/useShortViewportBand";

export type SysClock = {
  time: string;
  date: string;
  offset: string;
  nowMs: number;
};

interface ConsoleHeaderProps {
  sysClock: SysClock | null;
  shortBand: ShortViewportBand;
}

/**
 * Brand + Sys Time. Density comes from App so the shell and header share one band.
 * Boot travel is local — same compact-motion hook Starfield uses.
 */
export function ConsoleHeader({ sysClock, shortBand }: ConsoleHeaderProps) {
  const compactMotion = useCompactMotion();
  const bootHeaderVariants = useMemo(
    () => createBootHeaderVariants(compactMotion),
    [compactMotion],
  );
  const bootSysClockVariants = useMemo(
    () => createBootSysClockVariants(compactMotion),
    [compactMotion],
  );

  return (
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
            {sysClock?.time ?? "—:—:—"}
          </span>
          <span className="hidden sm:inline text-[9px] tracking-[0.15em] text-cyan-500 tabular-nums whitespace-nowrap">
            {sysClock?.date ?? "—"}
          </span>
          <span className="text-[9px] tracking-widest text-cyan-600 shrink-0">
            {sysClock?.offset ?? "—"}
          </span>
        </div>
        {/* Desktop: compact two-line block, still short */}
        <div className="hidden lg:flex flex-col font-mono uppercase leading-none gap-0.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] tracking-[0.3em] text-cyan-500">Sys Time</span>
            <span className="text-[9px] tracking-widest text-cyan-500">
              {sysClock?.offset ?? "—"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm tracking-[0.18em] text-cyan-100 tabular-nums">
              {sysClock?.time ?? "INITIALIZING..."}
            </span>
            <span className="text-[10px] tracking-[0.18em] text-cyan-500 tabular-nums">
              {sysClock?.date ?? "—"}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
