import { Vector3 } from "three";
import type { LaunchLocation } from "../types/location";
import { formatPadPlace } from "./padPlace";

export type PadFocus = {
  latitude: number;
  longitude: number;
  /** Launch site label for globe hover — not the pad/complex name. */
  siteLabel?: string;
  /** Region / country under the site, e.g. "California, USA". */
  placeLabel?: string | null;
  upcomingCount?: number;
};

/** Active Earth site from the locations catalog (spaceport centroid). */
export type GlobeSite = {
  id: string;
  locationApiId: number;
  latitude: number;
  longitude: number;
  siteLabel: string;
  placeLabel: string | null;
  /** Queue launches at this site; 0 means catalog-only (no upcoming line). */
  upcomingCount: number;
};

/**
 * Unit-sphere position for a lat/lon on the three.js + Solar System Scope earth.
 * Greenwich sits on +X; east longitude runs toward −Z (SphereGeometry UV seam).
 */
export function latLonToUnit(latDeg: number, lonDeg: number): Vector3 {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const cosLat = Math.cos(lat);
  return new Vector3(cosLat * Math.cos(lon), Math.sin(lat), -cosLat * Math.sin(lon));
}

/**
 * Earth `rotation.y` that puts this site on the +Z face (toward the camera).
 */
export function faceYawForLatLon(latDeg: number, lonDeg: number): number {
  const point = latLonToUnit(latDeg, lonDeg);
  return Math.atan2(-point.x, point.z);
}

/** Shortest signed delta from `from` to `to` in (−π, π]. */
export function shortestAngleDelta(from: number, to: number): number {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

type PadLike = {
  name?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  location?: { name?: string | null } | null;
} | null | undefined;

export type PadHoverLabels = {
  siteLabel: string;
  /** Null when place would duplicate the site line. */
  placeLabel: string | null;
};

/** Prefer spaceport / site name over pad complex name; place is region/country. */
export function hoverLabelsFromPad(pad: PadLike): PadHoverLabels {
  const locationName = pad?.location?.name?.trim();
  if (locationName) {
    const { site, place } = formatPadPlace(locationName);
    if (site) {
      const placeLabel =
        place && place.trim().toLowerCase() !== site.trim().toLowerCase()
          ? place
          : null;
      return { siteLabel: site, placeLabel };
    }
    return { siteLabel: place || locationName, placeLabel: null };
  }
  const padName = pad?.name?.trim();
  return { siteLabel: padName || "Launch site", placeLabel: null };
}

export function siteLabelFromPad(pad: PadLike): string {
  return hoverLabelsFromPad(pad).siteLabel;
}

/** Pull finite pad coords off a launch-shaped object; otherwise null. */
export function padFocusFromLaunch(launch: {
  pad?: PadLike;
} | null | undefined): PadFocus | null {
  const latitude = Number(launch?.pad?.latitude);
  const longitude = Number(launch?.pad?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  const labels = hoverLabelsFromPad(launch?.pad);
  return {
    latitude,
    longitude,
    siteLabel: labels.siteLabel,
    placeLabel: labels.placeLabel,
    upcomingCount: 1,
  };
}

export type PadSite = PadFocus & {
  id: string;
  siteLabel: string;
  upcomingCount: number;
};

function padKey(focus: PadFocus): string {
  // Collapse launches that share a complex (e.g. many F9 from SLC-4E).
  return `${focus.latitude.toFixed(3)},${focus.longitude.toFixed(3)}`;
}

/** Unique pad sites across the queue for the globe constellation. */
export function padSitesFromLaunches(
  launches: Array<{
    pad?: PadLike;
  }>,
): PadSite[] {
  const seen = new Map<string, PadSite>();
  for (const launch of launches) {
    const focus = padFocusFromLaunch(launch);
    if (!focus) continue;
    const id = padKey(focus);
    const existing = seen.get(id);
    if (existing) {
      existing.upcomingCount += 1;
      continue;
    }
    seen.set(id, {
      id,
      latitude: focus.latitude,
      longitude: focus.longitude,
      siteLabel: focus.siteLabel ?? "Launch site",
      placeLabel: focus.placeLabel ?? null,
      upcomingCount: 1,
    });
  }
  return [...seen.values()];
}

export function samePad(
  a: PadFocus | null | undefined,
  b: PadFocus | null | undefined,
): boolean {
  if (!a || !b) return false;
  return padKey(a) === padKey(b);
}

/** Prefer the constellation entry (with count) when the selected pad is in the queue. */
export function enrichPadFocus(
  focus: PadFocus | null,
  pads: PadSite[],
): PadFocus | null {
  if (!focus) return null;
  const match = pads.find((pad) => samePad(pad, focus));
  if (!match) return focus;
  return {
    latitude: match.latitude,
    longitude: match.longitude,
    siteLabel: match.siteLabel,
    placeLabel: match.placeLabel ?? null,
    upcomingCount: match.upcomingCount,
  };
}

function isEarthBody(location: LaunchLocation): boolean {
  const name = location.celestial_body?.name?.trim().toLowerCase();
  // Missing body is treated as Earth — LL2 only omits it on terrestrial sites.
  return !name || name === "earth";
}

function finiteLatLon(
  latitude: unknown,
  longitude: unknown,
): { latitude: number; longitude: number } | null {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { latitude: lat, longitude: lon };
}

/** Site / place labels for a catalog location row. */
export function hoverLabelsFromLocation(location: {
  name?: string | null;
  country?: { name?: string | null } | null;
}): PadHoverLabels {
  const rawName = location.name?.trim() || "Launch site";
  const { site, place } = formatPadPlace(rawName);
  // No comma → formatPadPlace keeps the whole string as `place` with site null.
  const siteLabel = site || rawName;
  const country = location.country?.name?.trim() || null;
  const placeCandidate = site ? place : country;
  const placeLabel =
    placeCandidate &&
    placeCandidate.trim().toLowerCase() !== siteLabel.trim().toLowerCase()
      ? placeCandidate
      : null;
  return { siteLabel, placeLabel };
}

/** Count upcoming launches per Launch Library location id. */
export function upcomingCountByLocationId(
  launches: Array<{ pad?: { location?: { id?: number | null } | null } | null }>,
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const launch of launches) {
    const id = launch.pad?.location?.id;
    if (typeof id !== "number" || !Number.isFinite(id)) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/**
 * Active Earth sites for the quiet globe catalog layer.
 * When `excludeWithUpcoming` is true, sites that already have queue pad
 * markers are omitted so pad + site don't double-mark the same coast.
 */
export function globeSitesFromLocations(
  locations: LaunchLocation[],
  launches: Array<{
    pad?: { location?: { id?: number | null } | null } | null;
  }> = [],
  options: { excludeWithUpcoming?: boolean } = {},
): GlobeSite[] {
  const { excludeWithUpcoming = true } = options;
  const upcoming = upcomingCountByLocationId(launches);
  const sites: GlobeSite[] = [];

  for (const location of locations) {
    if (!location.active || !isEarthBody(location)) continue;
    const coords = finiteLatLon(location.latitude, location.longitude);
    if (!coords) continue;

    const upcomingCount = upcoming.get(location.apiId) ?? 0;
    if (excludeWithUpcoming && upcomingCount > 0) continue;

    const labels = hoverLabelsFromLocation(location);
    sites.push({
      id: `loc-${location.apiId}`,
      locationApiId: location.apiId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      siteLabel: labels.siteLabel,
      placeLabel: labels.placeLabel,
      upcomingCount,
    });
  }

  return sites;
}
