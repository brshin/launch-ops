import { useMemo } from "react";
import { motion } from "framer-motion";
import { HourCycleFade } from "./HourCycleFade";
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

/** 12-hour faces keep AM/PM nearer the seconds. The reserved slot stays wide, so the date does not move. */
function ClockReadout({ time }: { time: string }) {
  const match = /^(.+?\d)\s+([AP]M)$/.exec(time);
  if (!match) return <>{time}</>;
  return (
    <span className="inline-flex items-baseline">
      <span>{match[1]}</span>
      <span className="ml-[0.22em]">{match[2]}</span>
    </span>
  );
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
  const next: HourCycle = cycle === "12" ? "24" : "12";
  return (
    <button
      type="button"
      aria-label={
        cycle === "12" ? "12-hour time, switch to 24-hour" : "24-hour time, switch to 12-hour"
      }
      onClick={() => onChange(next)}
      className={`shrink-0 cursor-pointer touch-manipulation px-1 py-1 -my-1 font-mono text-[9px] uppercase leading-none tracking-[0.14em] text-cyan-600 transition-colors duration-300 hover:text-cyan-300 ${className}`}
    >
      <HourCycleFade calm cycle={cycle}>
        {cycle}h
      </HourCycleFade>
    </button>
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
        <div className="flex lg:hidden min-w-0 flex-col font-mono uppercase leading-none gap-0.5">
          <div className="flex items-baseline gap-x-2">
            <span className="text-[9px] tracking-[0.2em] text-cyan-600 shrink-0">Sys</span>
            <HourCycleControl cycle={hourCycle} onChange={onHourCycle} className="max-[359px]:hidden" />
            <HourCycleFade
              calm
              reserve="00:00:00 PM"
              cycle={hourCycle}
              className="inline-block text-[11px] sm:text-xs text-slate-100 tabular-nums whitespace-nowrap tracking-[0.04em]"
            >
              <ClockReadout time={sysClock?.time ?? "—:—:—"} />
            </HourCycleFade>
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
            <HourCycleControl cycle={hourCycle} onChange={onHourCycle} className="min-[360px]:hidden" />
          </span>
        </div>
        {/* Desktop: compact two-line block, still short */}
        <div className="hidden lg:flex flex-col font-mono uppercase leading-none gap-0.5 xl:gap-1">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-baseline gap-1.5 shrink-0">
              <span className="text-[9px] xl:text-[10px] tracking-[0.3em] text-cyan-600">Sys Time</span>
              <HourCycleControl cycle={hourCycle} onChange={onHourCycle} />
            </span>
            <span
              className="max-w-[16rem] truncate text-[9px] xl:text-[11px] tracking-[0.14em] text-cyan-500"
              title={sysClock ? `${sysClock.zone} · ${sysClock.offset}` : undefined}
            >
              {sysClock ? `${sysClock.zone} · ${sysClock.offset}` : "—"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <HourCycleFade
              calm
              reserve="00:00:00 PM"
              cycle={hourCycle}
              className="inline-block text-sm xl:text-base text-slate-100 tabular-nums tracking-[0.18em]"
            >
              <ClockReadout time={sysClock?.time ?? "INITIALIZING..."} />
            </HourCycleFade>
            <span className="text-xs xl:text-sm tracking-[0.18em] text-cyan-300 tabular-nums">
              {sysClock?.date ?? "—"}
            </span>
          </div>
        </div>
      </motion.div>
      </div>
    </motion.header>
  );
}
