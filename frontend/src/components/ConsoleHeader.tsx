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

/**
 * 12-hour faces keep AM/PM nearer the seconds.
 * :ss is a small step down. The reserved slot stays full size so the date does not move.
 */
function ClockReadout({ time, compactSeconds = false }: { time: string; compactSeconds?: boolean }) {
  const meridianMatch = /^(.+?\d)\s+([AP]M)$/.exec(time);
  const body = meridianMatch ? meridianMatch[1] : time;
  const meridian = meridianMatch?.[2] ?? null;
  const secondsMatch = compactSeconds ? /^(\d{1,2}:\d{2})(:\d{2})$/.exec(body) : null;

  if (!secondsMatch && !meridian) return <>{time}</>;

  return (
    <span className="inline-flex items-baseline">
      {secondsMatch ? (
        <>
          <span>{secondsMatch[1]}</span>
          <span className="text-[0.9em]">{secondsMatch[2]}</span>
        </>
      ) : (
        <span>{body}</span>
      )}
      {meridian ? <span className="ml-[0.22em]">{meridian}</span> : null}
    </span>
  );
}

function HourCycleControl({
  cycle,
  onChange,
  className = "text-[9px]",
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
      className={`shrink-0 cursor-pointer touch-manipulation px-1 py-1 -my-1 font-mono uppercase leading-none tracking-[0.14em] text-cyan-600 transition-colors duration-300 hover:text-cyan-300 ${className}`}
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
 *
 * Flush clock (no tile): denser secondary type, Launch Ops primary. Vertical
 * hierarchy matches main — items-center so the clock sits in the brand band
 * rather than sharing the wordmark’s top edge.
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

  // Secondary to the wordmark — readable, never rivaling brand title size.
  const compact = shortBand === "short";
  const metaType = compact
    ? "text-[9px] tracking-[0.18em]"
    : "text-[9px] sm:text-[10px] tracking-[0.2em]";
  const zoneType = compact
    ? "text-[9px] tracking-[0.12em]"
    : "text-[9px] sm:text-[10px] tracking-[0.12em]";
  const cycleType = compact ? "text-[9px]" : "text-[9px] sm:text-[10px]";
  // ~½–⅔ of brand title; date a touch quieter on the same baseline.
  const timeType = compact
    ? "text-[11px] sm:text-xs tracking-[0.04em]"
    : shortBand === "mid"
      ? "text-sm tracking-[0.05em]"
      : "text-sm sm:text-[0.9375rem] tracking-[0.06em]";
  const dateType = compact
    ? "text-[11px] sm:text-xs tracking-[0.08em]"
    : shortBand === "mid"
      ? "text-[0.8125rem] sm:text-sm tracking-[0.09em]"
      : "text-sm tracking-[0.09em]";

  return (
    <motion.header
      className={`w-full flex justify-between items-center gap-2 sm:gap-3 max-[359px]:flex-col max-[359px]:items-stretch border-b border-cyan-900/60 relative z-20 shrink-0 density-ease ${
        shortBand === "short"
          ? "mb-1.5 pb-1.5 xl:mb-3 xl:pb-2.5"
          : shortBand === "mid"
            ? "mb-1.5 pb-2 sm:mb-2 xl:mb-3 xl:pb-2.5"
            : "mb-2 sm:mb-2.5 xl:mb-3 pb-2 sm:pb-2.5"
      }`}
      variants={bootHeaderVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col justify-center cursor-default shrink-0">
        <h1
          className={`font-bold text-slate-100 uppercase leading-none drop-shadow-[0_0_15px_rgba(34,211,238,0.2)] density-ease ${
            shortBand === "short"
              ? "text-xl tracking-[0.06em] min-[400px]:tracking-[0.1em] xl:text-3xl xl:tracking-[0.16em]"
              : shortBand === "mid"
                ? "text-xl min-[400px]:text-[1.35rem] sm:text-[1.65rem] tracking-[0.06em] min-[400px]:tracking-[0.11em] sm:tracking-[0.14em] xl:text-3xl xl:tracking-[0.16em]"
                : "text-xl min-[400px]:text-2xl sm:text-3xl tracking-[0.06em] sm:tracking-[0.16em]"
          }`}
        >
          Launch
          <span
            className={`text-cyan-500 ml-[0.12em] density-ease ${
              shortBand === "short"
                ? "tracking-[0.08em] xl:tracking-[0.1em]"
                : "tracking-[0.08em] sm:tracking-[0.1em]"
            }`}
          >
            Ops
          </span>
        </h1>
        <p
          className={`font-mono text-cyan-600 uppercase leading-none ${
            shortBand === "short"
              ? "hidden xl:block text-[10px] tracking-[0.3em] mt-1"
              : shortBand === "mid"
                ? "hidden sm:block text-[10px] tracking-[0.28em] sm:tracking-[0.3em] mt-1"
                : "hidden sm:block text-[10px] tracking-[0.28em] sm:tracking-[0.32em] mt-1"
          }`}
        >
          Global Launch Tracker
        </p>
      </div>

      <div className="flex min-w-0 justify-start max-[359px]:w-full max-[359px]:flex-none min-[360px]:flex-1 min-[360px]:justify-end">
      <motion.div
        className="flex w-max max-w-full min-w-0 items-center gap-1.5 sm:gap-2.5"
        variants={bootSysClockVariants}
        initial="hidden"
        animate="show"
      >
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />
        </span>

        {/* Below xl — same two-line stack as desk, denser type fills brand band */}
        <div className="flex xl:hidden min-w-0 flex-col gap-1 font-mono uppercase leading-none">
          <div className="flex items-baseline justify-between gap-2">
            <span className="flex items-baseline gap-1 shrink-0">
              <span className={`text-cyan-600 ${metaType}`}>Sys</span>
              <HourCycleControl cycle={hourCycle} onChange={onHourCycle} className={cycleType} />
            </span>
            <span
              className={`flex min-w-0 items-baseline gap-x-1 text-cyan-500/90 ${zoneType}`}
              title={sysClock ? `${sysClock.zone} · ${sysClock.offset}` : undefined}
            >
              <span className="min-w-0 truncate">{sysClock?.zone ?? "—"}</span>
              {sysClock ? <span className="shrink-0">· {sysClock.offset}</span> : null}
            </span>
          </div>
          <div className="flex items-baseline gap-2 sm:gap-2.5">
            <HourCycleFade
              calm
              reserve="00:00:00 PM"
              cycle={hourCycle}
              className={`inline-block text-slate-100 tabular-nums whitespace-nowrap ${timeType}`}
            >
              <ClockReadout time={sysClock?.time ?? "—:—:—"} compactSeconds />
            </HourCycleFade>
            <span
              className={`font-medium text-cyan-300/90 tabular-nums whitespace-nowrap shrink-0 ${dateType}`}
            >
              {sysClock?.date ?? "—"}
            </span>
          </div>
        </div>

        {/* Desktop — solid secondary (~base), well under the wordmark */}
        <div className="hidden xl:flex min-w-0 flex-col gap-1 font-mono uppercase leading-none">
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex items-baseline gap-1.5 shrink-0">
              <span className="text-[10px] tracking-[0.28em] text-cyan-600">Sys Time</span>
              <HourCycleControl
                cycle={hourCycle}
                onChange={onHourCycle}
                className="text-[10px]"
              />
            </span>
            <span
              className="max-w-[16rem] truncate text-[10px] tracking-[0.14em] text-cyan-500/90"
              title={sysClock ? `${sysClock.zone} · ${sysClock.offset}` : undefined}
            >
              {sysClock ? `${sysClock.zone} · ${sysClock.offset}` : "—"}
            </span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <HourCycleFade
              calm
              reserve="00:00:00 PM"
              cycle={hourCycle}
              className="inline-block text-base text-slate-100 tabular-nums tracking-[0.12em]"
            >
              <ClockReadout time={sysClock?.time ?? "INITIALIZING..."} compactSeconds />
            </HourCycleFade>
            <span className="text-[0.9375rem] font-medium tracking-[0.1em] text-cyan-300/90 tabular-nums">
              {sysClock?.date ?? "—"}
            </span>
          </div>
        </div>
      </motion.div>
      </div>
    </motion.header>
  );
}
