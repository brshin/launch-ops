/** Shared console-update types + display helpers (diff lives on the worker). */

export type ConsoleUpdateKind =
  | "webcast"
  | "scheduled"
  | "rescheduled"
  | "status"
  | "removed";

export type ConsoleUpdate = {
  id: string;
  kind: ConsoleUpdateKind;
  atMs: number;
  apiId: string;
  title: string;
  detail: string;
};

const KINDS = new Set<ConsoleUpdateKind>([
  "webcast",
  "scheduled",
  "rescheduled",
  "status",
  "removed",
]);

/** Coerce a socket/REST row into a ConsoleUpdate, or null if invalid. */
export function normalizeConsoleUpdate(raw: unknown): ConsoleUpdate | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const kind = row.kind;
  if (typeof kind !== "string" || !KINDS.has(kind as ConsoleUpdateKind)) {
    return null;
  }
  const id = typeof row.id === "string" ? row.id : null;
  const apiId = typeof row.apiId === "string" ? row.apiId : null;
  const title = typeof row.title === "string" ? row.title : null;
  const detail = typeof row.detail === "string" ? row.detail : null;
  const atMs = typeof row.atMs === "number" ? row.atMs : Number(row.atMs);
  if (!id || !apiId || !title || !detail || !Number.isFinite(atMs)) return null;
  return {
    id,
    kind: kind as ConsoleUpdateKind,
    atMs,
    apiId,
    title,
    detail,
  };
}

/** Merge newest-first; drop duplicate ids. */
export function mergeConsoleUpdates(
  incoming: ConsoleUpdate[],
  existing: ConsoleUpdate[],
  max = 24,
): ConsoleUpdate[] {
  const seen = new Set<string>();
  const merged: ConsoleUpdate[] = [];
  for (const update of [...incoming, ...existing]) {
    if (seen.has(update.id)) continue;
    seen.add(update.id);
    merged.push(update);
    if (merged.length >= max) break;
  }
  return merged;
}

/** Short age chip for the updates list. */
export function formatUpdateAge(atMs: number, nowMs: number): string {
  const delta = Math.max(0, nowMs - atMs);
  if (delta < 5_000) return "Just now";
  if (delta < 60_000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 60 * 60_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 24 * 60 * 60_000) {
    return `${Math.floor(delta / (60 * 60_000))}h ago`;
  }
  return `${Math.floor(delta / (24 * 60 * 60_000))}d ago`;
}

export function updateKindLabel(kind: ConsoleUpdateKind): string {
  switch (kind) {
    case "webcast":
      return "Live";
    case "scheduled":
      return "New";
    case "rescheduled":
      return "NET";
    case "status":
      return "Status";
    case "removed":
      return "Off";
  }
}
