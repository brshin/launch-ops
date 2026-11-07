import type { Launch } from "../types/launch";
import type { LaunchLocation } from "../types/location";
import { upcomingCountByLocationId } from "./globeFocus";
import { isUpcomingQueueLaunch } from "./launchTime";
import { isWebcastLive } from "./watchTarget";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export type OverviewRank = {
  label: string;
  count: number;
};

export type ConsoleOverviewModel = {
  upcomingCount: number;
  weekCount: number;
  sitesLit: number;
  streamingCount: number;
  earthActive: number;
  lunarSites: number;
  providers: OverviewRank[];
  orbits: OverviewRank[];
  /** Short home status — activity, not mission copy. */
  pulse: string;
};

function isEarthLocation(location: LaunchLocation): boolean {
  const name = location.celestial_body?.name?.trim().toLowerCase();
  return !name || name === "earth";
}

function isLunarLocation(location: LaunchLocation): boolean {
  return location.celestial_body?.name?.trim().toLowerCase() === "moon";
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

function buildPulse(input: {
  streamingCount: number;
  weekCount: number;
  upcomingCount: number;
}): string {
  if (input.streamingCount > 0) {
    return input.streamingCount === 1
      ? "A webcast is live on the board"
      : `${input.streamingCount} webcasts are live on the board`;
  }
  if (input.upcomingCount === 0) return "Board clear · waiting for the next launch";
  if (input.weekCount >= 5) {
    return `${input.weekCount} launches inside the next 7 days`;
  }
  if (input.weekCount >= 1) {
    return `${input.weekCount} launch${input.weekCount === 1 ? "" : "es"} inside the next 7 days`;
  }
  return "Select a launch or site to inspect";
}

/**
 * Home console model — clear board stats from the dual feed.
 * No year/Go jargon; lifetime catalog stays out of the dashboard.
 */
export function buildConsoleOverview(
  launches: Launch[],
  locations: LaunchLocation[],
  nowMs: number,
): ConsoleOverviewModel {
  const upcoming = launches.filter((launch) =>
    isUpcomingQueueLaunch(launch, nowMs),
  );

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

  const earthActive = locations.filter(
    (location) => location.active && isEarthLocation(location),
  ).length;
  const lunarSites = locations.filter((location) =>
    isLunarLocation(location),
  ).length;

  const providers = tally(
    upcoming.map(
      (launch) =>
        launch.launch_service_provider?.abbrev?.trim() ||
        launch.launch_service_provider?.name?.trim(),
    ),
  );

  const orbits = tally(
    upcoming.map(
      (launch) =>
        launch.mission?.orbit?.abbrev?.trim() ||
        launch.mission?.orbit?.name?.trim(),
    ),
  );

  return {
    upcomingCount: upcoming.length,
    weekCount,
    sitesLit,
    streamingCount,
    earthActive,
    lunarSites,
    providers,
    orbits,
    pulse: buildPulse({
      streamingCount,
      weekCount,
      upcomingCount: upcoming.length,
    }),
  };
}
