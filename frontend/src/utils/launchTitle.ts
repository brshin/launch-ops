import { Launch } from '../types/launch';

function isUsableMissionName(name?: string | null): boolean {
  if (!name?.trim()) return false;
  return name.trim().toLowerCase() !== 'unknown payload';
}

/** Prefer mission name; if unknown/missing, fall back to rocket, then launch.name. */
export function getLaunchTitle(launch: Launch): string {
  if (isUsableMissionName(launch.mission?.name)) {
    return launch.mission!.name;
  }

  return (
    launch.rocket?.configuration?.full_name ||
    launch.rocket?.configuration?.name ||
    launch.name
  );
}
