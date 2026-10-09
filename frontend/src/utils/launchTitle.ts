import { Launch } from '../types/launch';

function isUsableMissionName(name?: string | null): boolean {
  if (!name?.trim()) return false;
  return name.trim().toLowerCase() !== 'unknown payload';
}

export function getRocketName(launch: Launch): string | null {
  return (
    launch.rocket?.configuration?.full_name ||
    launch.rocket?.configuration?.name ||
    null
  );
}

function sameParty(a?: string | null, b?: string | null): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

type MarkSource = {
  image_url?: string | null;
  thumbnail_url?: string | null;
} | null;

/**
 * Square social mark first. The wide wordmark is the fallback.
 * Thumbnail over the full image, so the card does not download a hero file.
 */
export function agencyMarkUrl(party?: {
  logo?: MarkSource;
  social_logo?: MarkSource;
} | null): string | null {
  for (const mark of [party?.social_logo, party?.logo]) {
    const url = mark?.thumbnail_url?.trim() || mark?.image_url?.trim();
    if (url) return url;
  }
  return null;
}

export type MissionParty = {
  label: string;
  markUrl: string | null;
};

/**
 * Mission customers, excluding the launch provider.
 * Starlink stays "SpaceX"; Crew-13 gains NASA, CSA, and ROSCOSMOS.
 */
export function getMissionCustomers(launch: Launch): MissionParty[] {
  const provider = launch.launch_service_provider;
  const seen = new Set<string>();
  const customers: MissionParty[] = [];

  for (const agency of launch.mission?.agencies ?? []) {
    const label = agency.abbrev?.trim() || agency.name?.trim();
    if (!label) continue;
    const isProvider =
      sameParty(agency.abbrev, provider?.abbrev) ||
      sameParty(agency.name, provider?.name) ||
      sameParty(agency.abbrev, provider?.name) ||
      sameParty(agency.name, provider?.abbrev);
    if (isProvider) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    customers.push({ label, markUrl: agencyMarkUrl(agency) });
  }

  return customers;
}

const PLACEHOLDER_BRIEFS = new Set([
  "details tbd",
  "tbd",
  "tba",
  "unknown",
  "n/a",
  "to be determined",
  "to be announced",
]);

export const MISSING_MISSION_BRIEF = "No public payload details yet.";

const UNKNOWN_META = new Set(["unknown", "unk", "n/a"]);

function isKnownMeta(value?: string | null): boolean {
  if (!value?.trim()) return false;
  return !UNKNOWN_META.has(value.trim().toLowerCase());
}

/** Long orbit names, and their abbreviations, shown as a short plain label. */
const ORBIT_LABELS: Record<string, string> = {
  "low earth orbit": "Low Earth",
  leo: "Low Earth",
  "very low earth orbit": "Very Low Earth",
  vleo: "Very Low Earth",
  "polar orbit": "Polar",
  po: "Polar",
  "sun-synchronous orbit": "Sun-Sync",
  sso: "Sun-Sync",
  "medium earth orbit": "Medium Earth",
  meo: "Medium Earth",
  "geostationary orbit": "Geostationary",
  geo: "Geostationary",
  "geostationary transfer orbit": "GEO Transfer",
  gto: "GEO Transfer",
  "highly elliptical orbit": "Elliptical",
  heo: "Elliptical",
  "high earth orbit": "High Earth",
  "mars orbit": "Mars",
  "lunar orbit": "Lunar",
  "heliocentric orbit": "Heliocentric",
};

function orbitKey(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Short destination for the brief chip.
 * Prefers the orbit name, then the abbreviation, and hides unknown values.
 */
export function getMissionOrbitLabel(orbit?: {
  name?: string | null;
  abbrev?: string | null;
} | null): string | null {
  const name = orbit?.name?.trim() ?? "";
  const abbrev = orbit?.abbrev?.trim() ?? "";
  if (isKnownMeta(name) && ORBIT_LABELS[orbitKey(name)]) return ORBIT_LABELS[orbitKey(name)];
  if (isKnownMeta(abbrev) && ORBIT_LABELS[orbitKey(abbrev)]) return ORBIT_LABELS[orbitKey(abbrev)];
  if (isKnownMeta(name)) return name.replace(/\s+orbit$/i, "").trim() || name;
  if (isKnownMeta(abbrev)) return abbrev;
  return null;
}

/** Mission purpose for the brief chip. Classified flights drop the slash name. */
export function getMissionTypeLabel(type?: string | null): string | null {
  if (!isKnownMeta(type)) return null;
  const trimmed = type!.trim();
  if (trimmed.toLowerCase().replace(/\s*\/\s*/g, "/") === "government/top secret") {
    return "Classified";
  }
  return trimmed;
}

/** Real brief text, or one caption when the feed has no public description. */
export function getMissionBrief(description?: string | null): string {
  const normalized = description?.trim().replace(/\.+$/, "").trim().toLowerCase() ?? "";
  if (!normalized || PLACEHOLDER_BRIEFS.has(normalized)) return MISSING_MISSION_BRIEF;
  return description!.trim();
}

/** Prefer mission name; if unknown/missing, fall back to rocket, then launch.name. */
export function getLaunchTitle(launch: Launch): string {
  if (isUsableMissionName(launch.mission?.name)) {
    return launch.mission!.name;
  }

  return getRocketName(launch) || launch.name;
}
