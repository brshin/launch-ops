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

/**
 * Mission customers, excluding the launch provider.
 * Starlink stays "SpaceX"; Crew-13 gains NASA, CSA, and ROSCOSMOS.
 */
export function getMissionCustomers(launch: Launch): string[] {
  const provider = launch.launch_service_provider;
  const seen = new Set<string>();
  const customers: string[] = [];

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
    customers.push(label);
  }

  return customers;
}

/** Prefer mission name; if unknown/missing, fall back to rocket, then launch.name. */
export function getLaunchTitle(launch: Launch): string {
  if (isUsableMissionName(launch.mission?.name)) {
    return launch.mission!.name;
  }

  return getRocketName(launch) || launch.name;
}
