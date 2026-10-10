import { useEffect, useState } from "react";
import {
  CountdownFailureLabel,
  CountdownHoldLabel,
  TickingCountdown,
} from "../CountdownReadout";
import { HourCycleFade } from "../HourCycleFade";
import type { DensityChrome } from "../../lib/cardDensityChrome";
import type { LaunchTime } from "../../utils/launchTime";
import { prepareAgencyMark } from "../../utils/agencyMarkImage";
import type { MissionParty } from "../../utils/launchTitle";

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

/** Keep a hyphenated token intact once the title column can hold it. */
function Hyphenated({ text }: { text: string }) {
  return text.split(/(\s+)/).map((part, index) =>
    part.includes("-") ? (
      <span key={index} className="@[10.5rem]:whitespace-nowrap">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

/**
 * A parenthetical stays on the name's line only when the whole title fits.
 * Otherwise the `(…)` drops as its own block and the name wraps on its own.
 */
function TitleWords({ title }: { title: string }) {
  const chunks = title.split(/(\([^)]*\))/);
  if (chunks.length === 1) return <Hyphenated text={title} />;

  return chunks.map((chunk, index) => {
    const trimmed = chunk.trim();
    if (!trimmed) return null;
    const isParen = trimmed.startsWith("(");
    const spaceBefore =
      index > 0 && (/\s$/.test(chunks[index - 1] ?? "") || /^\s/.test(chunk));
    return (
      <span key={index}>
        {spaceBefore ? " " : null}
        <span
          className={`inline-block max-w-full ${isParen ? "" : "tracking-[-0.02em]"}`}
        >
          <Hyphenated text={trimmed} />
        </span>
      </span>
    );
  });
}

function getStatusColors(status: string) {
  switch (status) {
    case "Go":
      return {
        dot: "bg-emerald-400",
        glow: "shadow-[0_0_5px_#34d399]",
        text: "text-emerald-300",
        frame:
          "border-emerald-800/70 hover:border-emerald-400/80 active:border-emerald-400/80 hover:bg-emerald-950/50 active:bg-emerald-950/50",
      };
    case "In Flight":
      return {
        dot: "bg-sky-400",
        glow: "shadow-[0_0_5px_#38bdf8]",
        text: "text-sky-300",
        frame:
          "border-sky-800/70 hover:border-sky-400/80 active:border-sky-400/80 hover:bg-sky-950/50 active:bg-sky-950/50",
      };
    case "Success":
      return {
        dot: "bg-green-500",
        glow: "shadow-[0_0_5px_#22c55e]",
        text: "text-green-400",
        frame:
          "border-green-800/70 hover:border-green-500/80 active:border-green-500/80 hover:bg-green-950/50 active:bg-green-950/50",
      };
    case "Hold":
      return {
        dot: "bg-orange-400",
        glow: "shadow-[0_0_5px_#fb923c]",
        text: "text-orange-300",
        frame:
          "border-orange-800/70 hover:border-orange-400/80 active:border-orange-400/80 hover:bg-orange-950/40 active:bg-orange-950/40",
      };
    case "TBD":
      return {
        dot: "bg-yellow-400",
        glow: "shadow-[0_0_5px_#facc15]",
        text: "text-yellow-300",
        frame:
          "border-yellow-800/70 hover:border-yellow-400/80 active:border-yellow-400/80 hover:bg-yellow-950/40 active:bg-yellow-950/40",
      };
    case "TBC":
      return {
        dot: "bg-violet-400",
        glow: "shadow-[0_0_5px_#a78bfa]",
        text: "text-violet-300",
        frame:
          "border-violet-800/70 hover:border-violet-400/80 active:border-violet-400/80 hover:bg-violet-950/50 active:bg-violet-950/50",
      };
    case "Failure":
      return {
        dot: "bg-red-500",
        glow: "shadow-[0_0_5px_#ef4444]",
        text: "text-red-400",
        frame:
          "border-red-800/70 hover:border-red-500/80 active:border-red-500/80 hover:bg-red-950/40 active:bg-red-950/40",
      };
    case "Partial Failure":
      return {
        dot: "bg-rose-400",
        glow: "shadow-[0_0_5px_#fb7185]",
        text: "text-rose-300",
        frame:
          "border-rose-800/70 hover:border-rose-400/80 active:border-rose-400/80 hover:bg-rose-950/40 active:bg-rose-950/40",
      };
    default:
      return {
        dot: "bg-slate-400",
        glow: "shadow-[0_0_5px_#94a3b8]",
        text: "text-slate-300",
        frame:
          "border-slate-700/70 hover:border-slate-400/80 active:border-slate-400/80 hover:bg-slate-900/60 active:bg-slate-900/60",
      };
  }
}

/** Insignia beside the name. A failed image leaves the name. */
function PartyMark({ url }: { url: string }) {
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
    <span className={`inline-flex size-6 shrink-0 items-center justify-center sm:size-8 ${src ? "" : "invisible"}`}>
      {src ? (
        <img src={src} alt="" draggable={false} className="size-full object-contain" />
      ) : null}
    </span>
  );
}

function PartyName({ label, markUrl }: { label: string; markUrl?: string | null }) {
  return (
    <span className="flex w-max max-w-full shrink-0 items-center gap-2">
      {markUrl ? <PartyMark url={markUrl} /> : null}
      <span className="min-w-0 text-balance">{label}</span>
    </span>
  );
}

interface LaunchCardIdentityProps {
  chrome: DensityChrome;
  providerName: string;
  providerMarkUrl: string | null;
  customers: MissionParty[];
  title: string;
  rocketName: string | null;
  showRocketSubtitle: boolean;
  showRocket: boolean;
  status: string;
  launchTime: LaunchTime;
  showProvisional: boolean;
  tZero: LocalDateTime;
  hour12: boolean;
  time: CountdownParts;
}

/**
 * Provider, titles, status pills, and T−/T+ (or provisional NET).
 * Motion wrapper stays on LaunchCard so card stagger still sees a motion child.
 */
export function LaunchCardIdentity({
  chrome,
  providerName,
  providerMarkUrl,
  customers,
  title,
  rocketName,
  showRocketSubtitle,
  showRocket,
  status,
  launchTime,
  showProvisional,
  tZero,
  hour12,
  time,
}: LaunchCardIdentityProps) {
  const statusColors = getStatusColors(status);

  const parties = (
    <div
      className={`flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-mono text-cyan-600 uppercase lg:gap-x-4 lg:gap-y-1.5 lg:basis-full density-ease ${chrome.provider}`}
    >
      <PartyName label={providerName} markUrl={providerMarkUrl} />
      {customers.map((customer) => (
        <PartyName key={customer.label} label={customer.label} markUrl={customer.markUrl} />
      ))}
    </div>
  );

  const heading = (
    <h2
      className={`@container font-mono font-bold text-slate-100 uppercase text-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all group-hover:text-white break-words density-ease ${chrome.title}`}
    >
      <TitleWords title={title} />
    </h2>
  );

  const rocket = showRocketSubtitle && showRocket ? (
    <p className="lc-rocket mt-1 text-[10px] lg:text-xs font-mono text-cyan-600 uppercase tracking-[0.12em] lg:tracking-[0.22em] transition-colors group-hover:text-cyan-400 break-words">
      {rocketName}
    </p>
  ) : null;

  const netReadout = (
    <div className="flex w-full min-w-0 flex-col items-start gap-1 lg:w-auto lg:items-end">
      <span className="whitespace-nowrap font-mono text-xs font-bold tabular-nums text-slate-200 sm:text-[11px]">
        <HourCycleFade cycle={hour12 ? "12" : "24"} className="inline-block">
          <span>{tZero.date}</span>
          <span className="mx-1.5 text-slate-600">·</span>
          <span>{tZero.time}</span>
        </HourCycleFade>
      </span>
      <span className="whitespace-nowrap font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-amber-500/90">
        Net · Provisional
      </span>
    </div>
  );

  const statusPill = (className: string) => (
    <div
      className={`items-center gap-2 shrink-0 bg-[#020617]/80 border rounded-sm backdrop-blur-sm cursor-help transition-all duration-300 density-ease ${statusColors.frame} ${chrome.statusPill} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${statusColors.dot} ${statusColors.glow}`}
        ></span>
      </span>
      <span className={`text-[10px] font-mono uppercase tracking-wider lg:tracking-wider xl:tracking-widest ${statusColors.text}`}>
        Status: {status || "Unk"}
      </span>
    </div>
  );

  return (
    <>
      {parties}
      <div className="flex flex-row justify-between items-start gap-2 min-w-0 w-full lg:contents lg:w-auto lg:flex-1">
        <div className="group cursor-default min-w-0 flex-1">
          {heading}
          {rocket}
        </div>

        {/* Narrow stack only: status beside title */}
        {statusPill("flex lg:hidden")}
      </div>

      <div
        className={`flex flex-col items-start lg:items-end w-full lg:w-auto shrink-0 density-ease ${chrome.statusCol}`}
      >
        {statusPill("hidden lg:flex")}

        <div className="flex items-center gap-2 sm:gap-3 px-0 sm:px-2 lg:px-0 min-w-0">
          {showProvisional ? (
            netReadout
          ) : launchTime.phase === "hold" ? (
            <CountdownHoldLabel />
          ) : launchTime.phase === "failed" ? (
            <CountdownFailureLabel />
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
