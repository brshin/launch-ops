import { AnimatePresence, motion } from "framer-motion";
import { transitions } from "../lib/motionTokens";

type Urgency = "calm" | "closer" | "imminent" | "terminal";

function getUrgency(msUntilNet: number, mode: "minus" | "plus"): Urgency {
  if (mode === "plus") return "calm";
  if (msUntilNet <= 60_000) return "terminal";
  if (msUntilNet <= 10 * 60_000) return "imminent";
  if (msUntilNet <= 60 * 60_000) return "closer";
  return "calm";
}

const urgencyGlow: Record<
  Urgency,
  { textShadow: string | string[]; transition?: object }
> = {
  calm: {
    textShadow: "0 0 8px rgba(34,211,238,0.28)",
  },
  closer: {
    textShadow: "0 0 11px rgba(34,211,238,0.42)",
  },
  imminent: {
    textShadow: [
      "0 0 8px rgba(34,211,238,0.35)",
      "0 0 16px rgba(34,211,238,0.6)",
      "0 0 8px rgba(34,211,238,0.35)",
    ],
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
  terminal: {
    textShadow: [
      "0 0 10px rgba(34,211,238,0.5)",
      "0 0 20px rgba(34,211,238,0.85)",
      "0 0 10px rgba(34,211,238,0.5)",
    ],
    transition: { duration: 0.85, repeat: Infinity, ease: "easeInOut" },
  },
};

/** Single glyph — remounts via key when the digit changes so exit/enter can tick. */
function TickDigit({ char }: { char: string }) {
  return (
    <span className="relative inline-flex h-[1.2em] w-[1ch] shrink-0 items-center justify-center overflow-hidden tabular-nums">
      <AnimatePresence mode="sync" initial={false}>
        <motion.span
          key={char}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ y: "55%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-55%", opacity: 0 }}
          transition={transitions.snappy}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function TickGroup({ value, groupKey }: { value: string; groupKey: string }) {
  return (
    <span className="inline-flex items-center tracking-normal">
      {value.split("").map((char, index) => (
        <TickDigit key={`${groupKey}-${index}`} char={char} />
      ))}
    </span>
  );
}

function TickingDigits({
  days,
  hours,
  minutes,
  seconds,
  urgency,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  urgency: Urgency;
}) {
  const glow = urgencyGlow[urgency];
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return (
    <motion.span
      className="inline-flex items-center gap-x-1 font-mono font-bold text-lg md:text-xl text-cyan-400 tabular-nums tracking-normal"
      animate={{ textShadow: glow.textShadow }}
      transition={glow.transition ?? transitions.soft}
    >
      <TickGroup value={String(days)} groupKey="days" />
      <span className="w-[0.55ch] text-center text-cyan-500/80" aria-hidden>
        :
      </span>
      <TickGroup value={hh} groupKey="hours" />
      <span className="w-[0.55ch] text-center text-cyan-500/80" aria-hidden>
        :
      </span>
      <TickGroup value={mm} groupKey="minutes" />
      <span className="w-[0.55ch] text-center text-cyan-500/80" aria-hidden>
        :
      </span>
      <TickGroup value={ss} groupKey="seconds" />
    </motion.span>
  );
}

export function CountdownHoldLabel() {
  return (
    <motion.span
      className="text-lg md:text-xl font-mono font-bold text-amber-500 tracking-widest"
      style={{ textShadow: "0 0 8px rgba(245,158,11,0.35)" }}
      animate={{ opacity: [0.82, 1, 0.82] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
    >
      COUNTDOWN HOLD
    </motion.span>
  );
}

export function CountdownFailureLabel() {
  return (
    <motion.span
      className="text-lg md:text-xl font-mono font-bold text-red-500 tracking-widest"
      style={{ textShadow: "0 0 10px rgba(239,68,68,0.55)" }}
      animate={{
        x: [0, -1.5, 1.5, -1, 1, 0],
        opacity: [1, 0.65, 1, 0.8, 1],
      }}
      transition={{
        duration: 0.4,
        repeat: Infinity,
        repeatDelay: 2.4,
        ease: "easeInOut",
      }}
    >
      MISSION FAILURE
    </motion.span>
  );
}

export function AwaitingTelemetryLabel() {
  return (
    <motion.span
      className="text-lg md:text-xl font-mono font-bold text-cyan-600 tracking-widest"
      animate={{
        opacity: [0.55, 1, 0.55],
        textShadow: [
          "0 0 6px rgba(8,145,178,0.25)",
          "0 0 12px rgba(8,145,178,0.5)",
          "0 0 6px rgba(8,145,178,0.25)",
        ],
      }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    >
      AWAITING TELEMETRY
    </motion.span>
  );
}

interface TickingCountdownProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Milliseconds until NET (negative after liftoff). */
  difference: number;
  mode: "minus" | "plus";
}

/** Live D:HH:MM:SS readout with per-digit ticks and urgency glow. */
export function TickingCountdown({
  days,
  hours,
  minutes,
  seconds,
  difference,
  mode,
}: TickingCountdownProps) {
  const urgency = getUrgency(Math.max(difference, 0), mode);
  const label = mode === "minus" ? "T-Minus" : "T-Plus";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-cyan-500 uppercase tracking-[0.3em]">
        {label}
      </span>
      <TickingDigits
        days={days}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
        urgency={urgency}
      />
    </div>
  );
}
