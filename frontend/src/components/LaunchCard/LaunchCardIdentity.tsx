import {
  CountdownFailureLabel,
  CountdownHoldLabel,
  TickingCountdown,
} from "./CountdownReadout";
import type { DensityChrome } from "../lib/cardDensityChrome";
import type { LaunchTime } from "../utils/launchTime";

type CountdownParts = {
  difference: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type LocalDateTime = {
  date: string;
  time: string;
};

function getStatusColors(status: string) {
  switch (status) {
    case "Success":
    case "In Flight":
    case "Go":
      return {
        dot: "bg-cyan-400",
        glow: "shadow-[0_0_5px_#22d3ee]",
        text: "text-cyan-300",
        borderHover: "hover:border-cyan-500/80 active:border-cyan-500/80",
      };
    case "Hold":
    case "TBD":
    case "TBC":
      return {
        dot: "bg-amber-400",
        glow: "shadow-[0_0_5px_#fbbf24]",
        text: "text-amber-300",
        borderHover: "hover:border-amber-500/80 active:border-amber-500/80",
      };
    case "Failure":
    case "Partial Failure":
      return {
        dot: "bg-red-500",
        glow: "shadow-[0_0_5px_#ef4444]",
        text: "text-red-400",
        borderHover: "hover:border-red-500/80 active:border-red-500/80",
      };
    default:
      return {
        dot: "bg-slate-400",
        glow: "shadow-[0_0_5px_#94a3b8]",
        text: "text-slate-300",
        borderHover: "hover:border-slate-500/80 active:border-slate-500/80",
      };
  }
}

interface LaunchCardIdentityProps {
  chrome: DensityChrome;
  providerName: string;
  title: string;
  rocketName: string | null;
  showRocketSubtitle: boolean;
  showRocket: boolean;
  status: string;
  launchTime: LaunchTime;
  showProvisional: boolean;
  tZero: LocalDateTime;
  time: CountdownParts;
}

/**
 * Provider, titles, status pills, and T−/T+ (or provisional NET).
 * Motion wrapper stays on LaunchCard so card stagger still sees a motion child.
 */
export function LaunchCardIdentity({
  chrome,
  providerName,
  title,
  rocketName,
  showRocketSubtitle,
  showRocket,
  status,
  launchTime,
  showProvisional,
  tZero,
  time,
}: LaunchCardIdentityProps) {
  const statusColors = getStatusColors(status);

  return (
    <>
      <div className="flex flex-row justify-between items-start gap-2 min-w-0 w-full sm:contents">
        <div className="group cursor-default min-w-0 flex-1">
          <p
            className={`font-mono text-cyan-500 uppercase transition-all group-hover:text-cyan-400 break-words density-ease ${chrome.provider}`}
          >
            {providerName}
          </p>
          <h2
            className={`font-mono font-bold text-slate-100 uppercase text-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all group-hover:text-cyan-50 break-words density-ease ${chrome.title}`}
          >
            {title}
          </h2>
          {showRocketSubtitle && showRocket && (
            <p className="lc-rocket mt-1 text-[10px] sm:text-xs font-mono text-cyan-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] lg:tracking-[0.22em] transition-colors group-hover:text-cyan-300 break-words">
              {rocketName}
            </p>
          )}
        </div>

        {/* Narrow stack only: status beside title */}
        <div
          className={`flex sm:hidden items-center gap-2 shrink-0 bg-[#020617]/80 border border-cyan-800/60 rounded-sm backdrop-blur-sm cursor-help hover:bg-cyan-950/60 active:bg-cyan-950/60 ${statusColors.borderHover} transition-all duration-300 density-ease ${chrome.statusPill}`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${statusColors.dot} ${statusColors.glow}`}
            ></span>
          </span>
          <span className={`text-[10px] font-mono uppercase tracking-wider ${statusColors.text}`}>
            Status: {status || "Unk"}
          </span>
        </div>
      </div>

      <div
        className={`flex flex-col items-start sm:items-end w-full sm:w-auto shrink-0 density-ease ${chrome.statusCol}`}
      >
        <div
          className={`hidden sm:flex items-center gap-2 sm:gap-3 bg-[#020617]/80 border border-cyan-800/60 rounded-sm backdrop-blur-sm cursor-help hover:bg-cyan-950/60 active:bg-cyan-950/60 ${statusColors.borderHover} transition-all duration-300 density-ease ${chrome.statusPill}`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${statusColors.dot} ${statusColors.glow}`}
            ></span>
          </span>
          <span
            className={`text-[10px] font-mono uppercase tracking-wider sm:tracking-widest ${statusColors.text}`}
          >
            Status: {status || "Unk"}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 px-0 sm:px-2 min-w-0">
          {launchTime.phase === "hold" ? (
            <CountdownHoldLabel />
          ) : launchTime.phase === "failed" ? (
            <CountdownFailureLabel />
          ) : showProvisional ? (
            <div className="flex flex-col items-start sm:items-end gap-0.5">
              <span className="text-[10px] font-mono text-amber-500/90 uppercase tracking-[0.3em]">
                Net · Provisional
              </span>
              <span className="text-base sm:text-lg md:text-xl font-mono font-bold text-slate-300 tracking-wider sm:tracking-widest tabular-nums">
                <span>{tZero.date}</span>
                <span className="mx-1.5 text-slate-600">·</span>
                <span>{tZero.time}</span>
              </span>
            </div>
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
        </div>
      </div>
    </>
  );
}
