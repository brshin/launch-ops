import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCompactMotion } from "../../hooks/useCompactMotion";
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
 * Below lg the title column is narrow. A short parenthetical stays.
 * One that cannot fit that column on a single line is dropped, so it does
 * not wrap into extra title rows. Desktop keeps the full title.
 */
function TitleParen({ text, spaceBefore }: { text: string; spaceBefore: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const compact = useCompactMotion();

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const title = node.closest("h2");
    if (!title) return;

    let frame = 0;
    const fit = () => {
      const el = ref.current;
      const heading = el?.closest("h2");
      if (!el || !heading) return;
      if (!compact) {
        el.hidden = false;
        return;
      }
      const available = heading.clientWidth;
      if (available < 8) return;
      const style = getComputedStyle(heading);
      const probe = document.createElement("span");
      probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${style.font};letter-spacing:${style.letterSpacing};text-transform:${style.textTransform}`;
      probe.textContent = text;
      document.body.appendChild(probe);
      const overflows = probe.getBoundingClientRect().width > available + 1;
      probe.remove();
      if (el.hidden !== overflows) el.hidden = overflows;
    };

    fit();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    ro.observe(title);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [compact, text]);

  return (
    <span ref={ref}>
      {spaceBefore ? " " : null}
      <span className="inline-block max-w-full">
        <Hyphenated text={text} />
      </span>
    </span>
  );
}

/**
 * A parenthetical stays with the name. Below lg, a parenthetical that would
 * wrap on its own is left off the title.
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
    if (isParen) {
      return <TitleParen key={index} text={trimmed} spaceBefore={spaceBefore} />;
    }
    return (
      <span key={index}>
        {spaceBefore ? " " : null}
        <span className="inline-block max-w-full tracking-[-0.02em]">
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
  const compact = useCompactMotion();
  const phonePillRef = useRef<HTMLDivElement>(null);
  const [titleGap, setTitleGap] = useState(0);

  useLayoutEffect(() => {
    const pill = phonePillRef.current;
    if (!pill || !compact) {
      setTitleGap(0);
      return;
    }
    const measure = () => {
      const width = pill.getBoundingClientRect().width;
      setTitleGap(width > 0 ? Math.ceil(width + 10) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pill);
    return () => ro.disconnect();
  }, [compact, status]);

  const parties = (
    <div
      className={`flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-cyan-600 uppercase lg:gap-x-4 lg:gap-y-1.5 lg:basis-full density-ease ${chrome.provider}`}
    >
      <PartyName label={providerName} markUrl={providerMarkUrl} />
      {customers.map((customer) => (
        <PartyName key={customer.label} label={customer.label} markUrl={customer.markUrl} />
      ))}
    </div>
  );

  const heading = (
    <h2
      className={`@container font-mono font-bold leading-tight text-slate-100 uppercase text-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all group-hover:text-white break-words density-ease lg:leading-normal ${chrome.title}`}
    >
      <TitleWords title={title} />
    </h2>
  );

  const rocket = showRocketSubtitle && showRocket ? (
    <p className="lc-rocket mt-0.5 text-[10px] lg:mt-1 lg:text-xs font-mono text-cyan-600 uppercase tracking-[0.12em] lg:tracking-[0.22em] transition-colors group-hover:text-cyan-400 break-words">
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
      <span className={`max-lg:whitespace-nowrap text-[10px] font-mono uppercase leading-none tracking-wider lg:leading-normal lg:tracking-wider xl:tracking-widest ${statusColors.text}`}>
        Status: {status || "Unk"}
      </span>
    </div>
  );

  return (
    <>
      {parties}
      <div className="relative flex w-full min-w-0 items-start lg:contents lg:w-auto lg:flex-1">
        <div
          className="group min-w-0 flex-1"
          style={compact && titleGap > 0 ? { paddingRight: titleGap } : undefined}
        >
          {heading}
          {rocket}
        </div>

        {/* Out of flow so the pill's padding does not push the countdown down. */}
        <div ref={phonePillRef} className="absolute right-0 top-0 lg:hidden">
          {statusPill("flex")}
        </div>
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
