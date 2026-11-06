import { Vector3 } from "three";

export type PadFocus = {
  latitude: number;
  longitude: number;
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

/** Pull finite pad coords off a launch-shaped object; otherwise null. */
export function padFocusFromLaunch(launch: {
  pad?: { latitude?: number | string | null; longitude?: number | string | null } | null;
} | null | undefined): PadFocus | null {
  const latitude = Number(launch?.pad?.latitude);
  const longitude = Number(launch?.pad?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export type PadSite = PadFocus & { id: string };

function padKey(focus: PadFocus): string {
  // Collapse launches that share a complex (e.g. many F9 from SLC-4E).
  return `${focus.latitude.toFixed(3)},${focus.longitude.toFixed(3)}`;
}

/** Unique pad sites across the queue for the globe constellation. */
export function padSitesFromLaunches(
  launches: Array<{
    pad?: { latitude?: number | string | null; longitude?: number | string | null } | null;
  }>,
): PadSite[] {
  const seen = new Map<string, PadSite>();
  for (const launch of launches) {
    const focus = padFocusFromLaunch(launch);
    if (!focus) continue;
    const id = padKey(focus);
    if (!seen.has(id)) seen.set(id, { ...focus, id });
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
