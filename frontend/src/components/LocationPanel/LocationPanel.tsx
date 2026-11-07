import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { Launch } from "../../types/launch";
import type { LaunchLocation } from "../../types/location";
import { transitions, travel } from "../../lib/motionTokens";
import { useCompactMotion } from "../../hooks/useCompactMotion";
import { getLaunchTitle } from "../../utils/launchTitle";
import { hoverLabelsFromLocation } from "../../utils/globeFocus";
import { formatLocalDateTime } from "../../utils/localTime";

type LocationPanelProps = {
  location: LaunchLocation;
  upcoming: Launch[];
  hour12: boolean;
  onClose: () => void;
  onSelectLaunch: (apiId: string) => void;
};

const cardVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-cyan-900/50 bg-black/40 px-2.5 py-2">
      <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-cyan-600">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-sm tabular-nums tracking-wide text-slate-100">
        {value}
      </p>
    </div>
  );
}

/** Prefer hero → thumb → map; advance on load error (CDN / hotlink failures). */
function useLocationImageSrc(location: LaunchLocation): {
  src: string | null;
  credit: string | null;
  onError: () => void;
} {
  const candidates = useMemo(() => {
    const urls = [
      location.image?.image_url,
      location.image?.thumbnail_url,
      location.map_image,
    ];
    return [...new Set(urls.map((u) => u?.trim()).filter(Boolean))] as string[];
  }, [
    location.image?.image_url,
    location.image?.thumbnail_url,
    location.map_image,
  ]);

  const [index, setIndex] = useState(0);
  const key = candidates.join("|");
  useEffect(() => {
    setIndex(0);
  }, [key]);

  return {
    src: candidates[index] ?? null,
    credit: index < 2 ? location.image?.credit?.trim() || null : null,
    onError: () => {
      setIndex((i) => (i + 1 < candidates.length ? i + 1 : candidates.length));
    },
  };
}

/**
 * Inspector panel for a catalog launch site — sibling to LaunchCard.
 * Geography and lifetime metrics live here; mission detail stays on LaunchCard.
 */
export function LocationPanel({
  location,
  upcoming,
  hour12,
  onClose,
  onSelectLaunch,
}: LocationPanelProps) {
  const reduceMotion = useReducedMotion();
  const compactMotion = useCompactMotion();
  const labels = useMemo(() => hoverLabelsFromLocation(location), [location]);
  const { src: imageUrl, credit: imageCredit, onError: onImageError } =
    useLocationImageSrc(location);
  const description = location.description?.replace(/\r\n/g, "\n").trim() || null;
  const timezone = location.timezone_name?.trim() || null;

  const sectionVariants: Variants = useMemo(() => {
    const y = compactMotion ? travel.compact.sectionY : travel.desktop.sectionY;
    return {
      hidden: { opacity: 0, y },
      show: {
        opacity: 1,
        y: 0,
        transition: transitions.soft,
      },
    };
  }, [compactMotion]);

  return (
    <motion.div
      className="relative flex h-full min-h-0 w-full flex-col overflow-clip rounded-2xl border border-cyan-900/60 bg-black/10 shadow-[0_0_40px_rgba(8,145,178,0.15)] backdrop-blur-sm"
      variants={cardVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="card-hairline absolute left-12 right-12 top-0 h-3 overflow-hidden"
        style={{ originX: 0 }}
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={transitions.soft}
      >
        <div className="card-hairline-gleam" />
      </motion.div>

      <motion.div
        variants={sectionVariants}
        className="flex shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-4 sm:px-5"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-600">
            Launch site
          </p>
          <h2 className="mt-1 font-mono text-base uppercase tracking-[0.06em] text-slate-50 sm:text-lg break-words">
            {labels.siteLabel}
          </h2>
          {labels.placeLabel ? (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-500 break-words">
              {labels.placeLabel}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`rounded-sm border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${
              location.active
                ? "border-emerald-700/60 text-emerald-400"
                : "border-zinc-700/60 text-zinc-500"
            }`}
          >
            {location.active ? "Active" : "Inactive"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-700 transition-colors hover:text-cyan-400"
          >
            Close
          </button>
        </div>
      </motion.div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pb-3 sm:px-5">
        <motion.div
          variants={sectionVariants}
          className="relative aspect-[16/10] max-h-36 w-full shrink-0 overflow-clip rounded-lg border border-cyan-900/60 bg-[#020617] shadow-[inset_0_0_30px_rgba(0,0,0,1)]"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={location.image?.name || labels.siteLabel}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={onImageError}
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-800">
              No site imagery
            </div>
          )}
          {imageUrl && imageCredit ? (
            <p className="absolute bottom-1.5 right-2 max-w-[80%] truncate font-mono text-[8px] uppercase tracking-[0.12em] text-cyan-200/80">
              {imageCredit}
            </p>
          ) : null}
        </motion.div>

        <motion.div
          variants={sectionVariants}
          className="grid shrink-0 grid-cols-3 gap-2"
        >
          <Metric label="Upcoming" value={upcoming.length} />
          <Metric label="Total" value={location.total_launch_count ?? 0} />
          <Metric label="Landings" value={location.total_landing_count ?? 0} />
        </motion.div>

        {(timezone ||
          (typeof location.latitude === "number" &&
            typeof location.longitude === "number")) && (
          <motion.div
            variants={sectionVariants}
            className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-700"
          >
            {timezone ? <span>TZ {timezone}</span> : null}
            {typeof location.latitude === "number" &&
            typeof location.longitude === "number" ? (
              <span>
                {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
              </span>
            ) : null}
          </motion.div>
        )}

        <motion.div
          variants={sectionVariants}
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-cyan-900/50 bg-black/30"
        >
          <div className="console-scrollbar console-scrollbar-y min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
            {description ? (
              <p className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-slate-300">
                {description}
              </p>
            ) : (
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-800">
                No site brief on file
              </p>
            )}

            {upcoming.length > 0 ? (
              <div className="mt-4 border-t border-cyan-900/40 pt-3">
                <p className="mb-2 text-[9px] font-mono uppercase tracking-[0.16em] text-cyan-600">
                  Upcoming
                </p>
                <ul className="flex flex-col gap-1.5">
                  {upcoming.map((launch) => (
                    <li key={launch.apiId}>
                      <button
                        type="button"
                        onClick={() => onSelectLaunch(launch.apiId)}
                        className="group flex w-full flex-col items-start rounded-md border border-cyan-900/40 bg-cyan-950/20 px-2.5 py-2 text-left transition-colors hover:border-cyan-600/50 hover:bg-cyan-950/40"
                      >
                        <span className="truncate font-mono text-[11px] uppercase tracking-[0.08em] text-slate-100 group-hover:text-white">
                          {getLaunchTitle(launch)}
                        </span>
                        <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-600 group-hover:text-cyan-400">
                          {formatLocalDateTime(launch.net, { hour12 }).label}
                          {launch.pad?.name ? ` · ${launch.pad.name}` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
