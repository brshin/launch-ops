import type { Launch } from "../types/launch";
import type { LaunchLocation } from "../types/location";
import { upcomingCountByLocationId } from "./globeFocus";
import { agencyMarkUrl, getMissionOrbitLabel } from "./launchTitle";
import { getLaunchTime, isUpcomingQueueLaunch } from "./launchTime";
import { isWebcastLive } from "./watchTarget";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export type OverviewRank = {
  label: string;
  count: number;
  /** Provider mark when available (destinations leave null). */
  markUrl?: string | null;
};

export type ConsoleOverviewModel = {
  upcomingCount: number;
  weekCount: number;
  sitesLit: number;
  streamingCount: number;
  goCount: number;
  /**
   * Sum of catalog lifetime attempts on active Earth sites.
   * Rises as LL2 updates site totals — not a calendar-year counter
   * (that would need a past-launches ingest).
   */
  lifetimeAttempts: number;
  providers: OverviewRank[];
  /** Plain-language destinations (Low Earth, Sun-Sync, …). */
  orbits: OverviewRank[];
  /** Soonest upcoming launch — drives the home ETA headline. */
  nextLaunch: Launch | null;
};

function isEarthLocation(location: LaunchLocation): boolean {
  const name = location.celestial_body?.name?.trim().toLowerCase();
  return !name || name === "earth";
}

function tally(
  values: Array<string | null | undefined>,
  limit = 5,
): OverviewRank[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const label = (raw || "").trim();
    if (!label || label.toUpperCase() === "N/A") continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function tallyProviders(launches: Launch[], limit = 5): OverviewRank[] {
  const counts = new Map<string, { count: number; markUrl: string | null }>();
  for (const launch of launches) {
    const label =
      launch.launch_service_provider?.abbrev?.trim() ||
      launch.launch_service_provider?.name?.trim();
    if (!label) continue;
    const prior = counts.get(label);
    if (prior) {
      prior.count += 1;
      continue;
    }
    counts.set(label, {
      count: 1,
      markUrl: agencyMarkUrl(launch.launch_service_provider),
    });
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, row]) => ({
      label,
      count: row.count,
      markUrl: row.markUrl,
    }));
}

/** Compact readout for large catalog totals — 8742 → 8.7k */
export function formatCompactCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) return "0";
  if (count < 1000) return String(Math.round(count));
  if (count < 10_000) {
    const tenths = Math.round(count / 100) / 10;
    return `${tenths}k`;
  }
  return `${Math.round(count / 1000)}k`;
}

export type NextLaunchHeadline = {
  /** Soft lead-in, e.g. "Next launch in" */
  lead: string;
  /** Emphasized ETA / status chip, e.g. "1d 11h" */
  emphasis: string;
};

/**
 * Home header ETA — minute/hour/day grain only (no seconds), so it
 * stays readable and doesn’t thrash every tick.
 */
export function formatNextLaunchHeadline(
  launch: Launch | null,
  nowMs: number,
): NextLaunchHeadline | null {
  if (!launch?.net) return null;

  const time = getLaunchTime({
    net: launch.net,
    status: launch.status?.abbrev,
    netPrecision: launch.net_precision,
    now: nowMs,
  });

  if (time.phase === "hold") {
    return { lead: "Next launch", emphasis: "On hold" };
  }
  if (time.phase === "live") {
    return { lead: "Launch", emphasis: "In flight" };
  }
  if (time.phase === "failed") return null;
  if (time.phase === "provisional" || !time.preciseEnough) {
    return { lead: "Next launch", emphasis: "Time TBD" };
  }
  if (time.msUntilNet <= 0) return null;

  const ms = time.msUntilNet;
  if (ms < MINUTE_MS) {
    return { lead: "Next launch in", emphasis: "Under 1 min" };
  }
  if (ms < HOUR_MS) {
    const minutes = Math.max(1, Math.floor(ms / MINUTE_MS));
    return { lead: "Next launch in", emphasis: `${minutes} min` };
  }
  if (ms < DAY_MS) {
    const hours = Math.max(1, Math.floor(ms / HOUR_MS));
    return { lead: "Next launch in", emphasis: `${hours} hr` };
  }

  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  if (hours === 0) {
    return {
      lead: "Next launch in",
      emphasis: `${days} day${days === 1 ? "" : "s"}`,
    };
  }
  // NBSP so "1d 9h" can't wrap between units on a narrow phone header.
  return { lead: "Next launch in", emphasis: `${days}d\u00A0${hours}h` };
}

/**
 * Home console model — clear schedule stats from the dual feed.
 */
export function buildConsoleOverview(
  launches: Launch[],
  locations: LaunchLocation[],
  nowMs: number,
): ConsoleOverviewModel {
  const upcoming = launches
    .filter((launch) => isUpcomingQueueLaunch(launch, nowMs))
    .slice()
    .sort((a, b) => Date.parse(a.net) - Date.parse(b.net));

  const nextLaunch = upcoming[0] ?? null;

  const weekCount = upcoming.filter((launch) => {
    const t = Date.parse(launch.net);
    return Number.isFinite(t) && t >= nowMs && t <= nowMs + WEEK_MS;
  }).length;

  const sitesLit = upcomingCountByLocationId(launches, nowMs).size;

  const streamingCount = upcoming.filter((launch) =>
    isWebcastLive({
      webcastLive: launch.webcast_live,
      vidUrls: launch.vid_urls,
    }),
  ).length;

  const goCount = upcoming.filter(
    (launch) => (launch.status?.abbrev || "").trim() === "Go",
  ).length;

  const lifetimeAttempts = locations
    .filter((location) => location.active && isEarthLocation(location))
    .reduce((sum, location) => sum + (location.total_launch_count || 0), 0);

  const providers = tallyProviders(upcoming);

  const orbits = tally(
    upcoming.map((launch) => getMissionOrbitLabel(launch.mission?.orbit)),
  );

  return {
    upcomingCount: upcoming.length,
    weekCount,
    sitesLit,
    streamingCount,
    goCount,
    lifetimeAttempts,
    providers,
    orbits,
    nextLaunch,
  };
}
