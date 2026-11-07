import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { Launch } from "../../types/launch";
import type { LaunchLocation } from "../../types/location";
import { transitions, travel } from "../../lib/motionTokens";
import { locationDensityChrome } from "../../lib/cardDensityChrome";
import { useCompactMotion } from "../../hooks/useCompactMotion";
import {
  useCardDensityBand,
  type CardDensity,
} from "../../hooks/useCardDensityBand";
import { useShortViewportBand } from "../../hooks/useShortViewportBand";
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
  pad,
  labelClass,
  valueClass,
}: {
  label: string;
  value: string | number;
  pad: string;
  labelClass: string;
  valueClass: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-lg border border-slate-700/55 bg-black/35 ${pad}`}
    >
      <p
        className={`font-mono uppercase text-slate-500 density-ease ${labelClass}`}
      >
        {label}
      </p>
      <p
        className={`truncate font-mono tabular-nums tracking-wide text-slate-100 density-ease ${valueClass}`}
      >
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
 * Same density bands as mission card; upcoming + brief share leftover height.
 */
export function LocationPanel({
  location,
  upcoming,
  hour12,
  onClose,
  onSelectLaunch,
}: LocationPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const compactMotion = useCompactMotion();
  const shortBand = useShortViewportBand();
  const cardBand = useCardDensityBand(rootRef, compactMotion);

  const density: CardDensity = useMemo(() => {
    if (!compactMotion) return "roomy";
    const rank: Record<CardDensity, number> = { roomy: 0, mid: 1, dense: 2 };
    const fromShort: CardDensity =
      shortBand === "short" ? "dense" : shortBand === "mid" ? "mid" : "roomy";
    return rank[cardBand] >= rank[fromShort] ? cardBand : fromShort;
  }, [compactMotion, cardBand, shortBand]);

  const chrome = locationDensityChrome[density];
  const compactTravel = density !== "roomy" || compactMotion;

  const labels = useMemo(() => hoverLabelsFromLocation(location), [location]);
  const { src: imageUrl, credit: imageCredit, onError: onImageError } =
    useLocationImageSrc(location);
  const description = location.description?.replace(/\r\n/g, "\n").trim() || null;
  const hasUpcoming = upcoming.length > 0;

  const sectionVariants: Variants = useMemo(() => {
    const y = compactTravel ? travel.compact.sectionY : travel.desktop.sectionY;
    return {
      hidden: { opacity: 0, y },
      show: {
        opacity: 1,
        y: 0,
        transition: transitions.soft,
      },
    };
  }, [compactTravel]);

  return (
    <motion.div
      ref={rootRef}
      data-inspector="site"
      data-density={density}
      className={`relative flex h-full min-h-0 w-full flex-col overflow-clip rounded-2xl border border-slate-700/50 bg-black/15 shadow-[0_0_40px_rgba(15,23,42,0.45)] backdrop-blur-sm density-ease ${chrome.rootPad}`}
      variants={cardVariants}
      initial="hidden"
      animate="show"
    >
      {/* Geographic rail — distinguishes SITE from mission cyan chrome. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-teal-400/85 via-teal-600/55 to-slate-600/40"
        aria-hidden
      />

      <motion.div
        className="absolute left-12 right-12 top-0 h-px overflow-hidden bg-slate-700/60"
        style={{ originX: 0 }}
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={transitions.soft}
      />

      <motion.div
        variants={sectionVariants}
        className={`flex shrink-0 items-start justify-between density-ease ${chrome.identity}`}
      >
        <div className="min-w-0">
          <span
            className={`inline-flex rounded-sm border border-teal-700/55 bg-teal-950/50 font-mono uppercase text-teal-300 density-ease ${chrome.chip}`}
          >
            Site
          </span>
          <h2
            className={`font-mono uppercase text-slate-50 break-words density-ease ${chrome.title}`}
          >
            {labels.siteLabel}
          </h2>
          {labels.placeLabel ? (
            <p
              className={`font-mono uppercase text-slate-400 break-words density-ease ${chrome.place}`}
            >
              {labels.placeLabel}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 font-mono uppercase text-slate-500 transition-colors hover:text-teal-300 density-ease ${chrome.close}`}
        >
          Close
        </button>
      </motion.div>

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden density-ease ${chrome.bodyGap}`}
      >
        <motion.div
          variants={sectionVariants}
          className={`relative aspect-[16/10] w-full shrink-0 overflow-clip rounded-lg border border-slate-700/55 bg-[#020617] shadow-[inset_0_0_30px_rgba(0,0,0,1)] density-ease ${chrome.imageMax}`}
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
            <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
              No site imagery
            </div>
          )}
          {imageUrl && imageCredit ? (
            <p className="absolute bottom-1.5 right-2 max-w-[80%] truncate font-mono text-[8px] uppercase tracking-[0.12em] text-slate-200/75">
              {imageCredit}
            </p>
          ) : null}
        </motion.div>

        <motion.div
          variants={sectionVariants}
          className={`grid shrink-0 grid-cols-3 density-ease ${chrome.metricGap}`}
        >
          <Metric
            label="Upcoming"
            value={upcoming.length}
            pad={chrome.metricPad}
            labelClass={chrome.metricLabel}
            valueClass={chrome.metricValue}
          />
          <Metric
            label="Total"
            value={location.total_launch_count ?? 0}
            pad={chrome.metricPad}
            labelClass={chrome.metricLabel}
            valueClass={chrome.metricValue}
          />
          <Metric
            label="Landings"
            value={location.total_landing_count ?? 0}
            pad={chrome.metricPad}
            labelClass={chrome.metricLabel}
            valueClass={chrome.metricValue}
          />
        </motion.div>

        {/*
          Upcoming hugs its rows (cap + scroll when long); brief takes the
          leftover. A 50/50 flex-1 split left empty air under 1–2 launches.
        */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {hasUpcoming ? (
            <motion.section
              variants={sectionVariants}
              className="flex max-h-[min(42%,13rem)] min-h-0 shrink-0 flex-col overflow-hidden rounded-lg border border-teal-900/40 bg-teal-950/15"
            >
              <div
                className={`flex shrink-0 items-center justify-between gap-2 border-b border-teal-900/35 density-ease ${chrome.sectionHead}`}
              >
                <p className="font-mono uppercase text-teal-400/90">Upcoming</p>
                <p className="font-mono uppercase text-teal-700">
                  {upcoming.length}
                </p>
              </div>
              <ul
                className={`console-scrollbar console-scrollbar-y min-h-0 overflow-y-auto density-ease ${chrome.listPad}`}
              >
                {upcoming.map((launch) => (
                  <li key={launch.apiId}>
                    <button
                      type="button"
                      onClick={() => onSelectLaunch(launch.apiId)}
                      className="group flex w-full flex-col items-start rounded-md border border-slate-700/45 bg-black/30 px-2.5 py-2 text-left transition-colors hover:border-teal-600/45 hover:bg-teal-950/30"
                    >
                      <span
                        className={`truncate font-mono uppercase text-slate-100 group-hover:text-white density-ease ${chrome.listTitle}`}
                      >
                        {getLaunchTitle(launch)}
                      </span>
                      <span
                        className={`font-mono uppercase text-slate-500 group-hover:text-teal-400/90 density-ease ${chrome.listMeta}`}
                      >
                        {formatLocalDateTime(launch.net, { hour12 }).label}
                        {launch.pad?.name ? ` · ${launch.pad.name}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.section>
          ) : null}

          <motion.section
            variants={sectionVariants}
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-700/45 bg-black/30"
          >
            <div
              className={`shrink-0 border-b border-slate-800/80 density-ease ${chrome.sectionHead}`}
            >
              <p className="font-mono uppercase text-slate-500">Brief</p>
            </div>
            <div
              className={`console-scrollbar console-scrollbar-y min-h-0 flex-1 overflow-y-auto density-ease ${chrome.briefBody}`}
            >
              {description ? (
                <p className="whitespace-pre-wrap font-mono text-slate-300">
                  {description}
                </p>
              ) : (
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">
                  No site brief on file
                </p>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
