import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  createBootHeaderVariants,
  createBootSysClockVariants,
} from "../lib/bootMotion";
import { useCompactMotion } from "../hooks/useCompactMotion";
import type { ShortViewportBand } from "../hooks/useShortViewportBand";
import type { HourCycle } from "../utils/hourCycle";

export type SysClock = {
  time: string;
  date: string;
  offset: string;
  /** Shared zone name, such as Pacific or Singapore. */
  zone: string;
  nowMs: number;
};

interface ConsoleHeaderProps {
  sysClock: SysClock | null;
  shortBand: ShortViewportBand;
  hourCycle: HourCycle;
  onHourCycle: (cycle: HourCycle) => void;
}

function HourCycleControl({
  cycle,
  onChange,
  className = "",
}: {
  cycle: HourCycle;
  onChange: (cycle: HourCycle) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Time format"
      className={`flex shrink-0 items-stretch overflow-clip rounded-sm border border-cyan-800/70 ${className}`}
    >
      {(["24", "12"] as const).map((option) => {
        const active = cycle === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            aria-label={option === "24" ? "24-hour time" : "12-hour time"}
            onClick={() => onChange(option)}
            className={`cursor-pointer touch-manipulation px-1.5 py-1 font-mono text-[9px] leading-none tracking-[0.08em] transition-colors ${
              option === "12" ? "border-l border-cyan-800/70" : ""
            } ${
              active
                ? "bg-cyan-950 font-medium text-slate-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.45)]"
                : "text-cyan-700 hover:text-cyan-400 active:text-cyan-400"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Brand + Sys Time. Density comes from App so the shell and header share one band.
 * Boot travel is local — same compact-motion hook Starfield uses.
 */
export function ConsoleHeader({
  sysClock,
  shortBand,
  hourCycle,
  onHourCycle,
}: ConsoleHeaderProps) {
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
      className={`w-full flex justify-between items-center gap-2 sm:gap-3 border-b border-cyan-900/60 relative z-20 shrink-0 density-ease ${
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
      <div className="flex flex-col justify-center cursor-default shrink-0">
        <h1
          className={`font-bold text-slate-100 uppercase leading-none drop-shadow-[0_0_15px_rgba(34,211,238,0.2)] density-ease ${
            shortBand === "short"
              ? "text-xl tracking-[0.1em] lg:text-3xl lg:tracking-[0.16em]"
              : shortBand === "mid"
                ? "text-[1.35rem] sm:text-[1.65rem] tracking-[0.11em] sm:tracking-[0.14em] lg:text-3xl lg:tracking-[0.16em]"
                : "text-2xl sm:text-3xl tracking-[0.06em] sm:tracking-[0.16em]"
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
          className={`font-mono text-cyan-600 uppercase leading-none ${
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

      <div className="flex min-w-0 flex-1 justify-end">
      <motion.div
        className="flex w-max max-w-full min-w-0 items-center gap-1.5 sm:gap-2.5 bg-black/20 border border-cyan-800/50 px-2 py-1 sm:px-3 sm:py-1.5 xl:px-3.5 xl:py-2 rounded-sm backdrop-blur-md"
        variants={bootSysClockVariants}
        initial="hidden"
        animate="show"
      >
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_5px_#22d3ee]"></span>
        </span>
        {/* Below desktop: time stays on one line; a long zone wraps under it */}
        <div className="flex lg:hidden flex-col font-mono uppercase leading-none gap-0.5">
          <div className="flex items-baseline gap-x-2">
            <span className="text-[9px] tracking-[0.2em] text-cyan-600 shrink-0">Sys</span>
            <span
              className={`text-[11px] sm:text-xs text-slate-100 tabular-nums whitespace-nowrap shrink-0 ${
                hourCycle === "12" ? "tracking-[0.04em]" : "tracking-[0.14em]"
              }`}
            >
              {sysClock?.time ?? "—:—:—"}
            </span>
            <span className="hidden sm:inline text-[9px] tracking-[0.15em] text-cyan-300 tabular-nums whitespace-nowrap shrink-0">
              {sysClock?.date ?? "—"}
            </span>
          </div>
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className="flex min-w-0 max-w-full items-baseline gap-x-1 text-[9px] text-cyan-500"
              title={sysClock ? `${sysClock.zone} · ${sysClock.offset}` : undefined}
            >
              <span className="min-w-0 truncate">{sysClock?.zone ?? "—"}</span>
              {sysClock ? <span className="shrink-0">· {sysClock.offset}</span> : null}
            </span>
            <HourCycleControl cycle={hourCycle} onChange={onHourCycle} className="lg:hidden" />
          </span>
        </div>
        {/* Desktop: compact two-line block, still short */}
        <div className="hidden lg:flex flex-col font-mono uppercase leading-none gap-0.5 xl:gap-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] xl:text-[10px] tracking-[0.3em] text-cyan-600 shrink-0">Sys Time</span>
            <span
              className="max-w-[16rem] truncate text-[9px] xl:text-[11px] tracking-[0.14em] text-cyan-500"
              title={sysClock ? `${sysClock.zone} · ${sysClock.offset}` : undefined}
            >
              {sysClock ? `${sysClock.zone} · ${sysClock.offset}` : "—"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-sm xl:text-base text-slate-100 tabular-nums ${
                hourCycle === "12" ? "tracking-[0.08em]" : "tracking-[0.18em]"
              }`}
            >
              {sysClock?.time ?? "INITIALIZING..."}
            </span>
            <span className="text-xs xl:text-sm tracking-[0.18em] text-cyan-300 tabular-nums">
              {sysClock?.date ?? "—"}
            </span>
          </div>
        </div>
        <HourCycleControl cycle={hourCycle} onChange={onHourCycle} className="hidden lg:flex" />
      </motion.div>
      </div>
    </motion.header>
  );
}
