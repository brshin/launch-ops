/**
 * Diff two upcoming-board snapshots into console update events.
 * Used by the worker before Redis overwrite (prev is still in cache).
 */

const KIND_PRIORITY = {
  webcast: 0,
  scheduled: 1,
  rescheduled: 2,
  status: 3,
  removed: 4,
};

function isUsableMissionName(name) {
  if (!name || !String(name).trim()) return false;
  return String(name).trim().toLowerCase() !== "unknown payload";
}

function getLaunchTitle(launch) {
  if (isUsableMissionName(launch?.mission?.name)) {
    return String(launch.mission.name).trim();
  }
  const rocket =
    launch?.rocket?.configuration?.full_name ||
    launch?.rocket?.configuration?.name;
  if (rocket && String(rocket).trim()) return String(rocket).trim();
  return (launch?.name && String(launch.name).trim()) || "Launch";
}

function statusOf(launch) {
  return (launch?.status?.abbrev || "").trim();
}

function isLive(launch) {
  if (launch?.webcast_live) return true;
  return (launch?.vid_urls ?? []).some((entry) => Boolean(entry?.live));
}

/** Compact UTC NET for update details — 21 Aug 00:00Z */
function formatNetChip(net) {
  if (!net) return null;
  const date = new Date(net);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getUTCDate();
  const month = date.toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${hh}:${mm}Z`;
}

/**
 * @param {object[]} previous
 * @param {object[]} next
 * @param {number} [atMs]
 * @returns {Array<{id: string, kind: string, atMs: number, apiId: string, title: string, detail: string}>}
 */
function diffLaunchBoard(previous, next, atMs = Date.now()) {
  const prevList = Array.isArray(previous) ? previous : [];
  const nextList = Array.isArray(next) ? next : [];
  const prevMap = new Map(prevList.map((launch) => [launch.apiId, launch]));
  const nextMap = new Map(nextList.map((launch) => [launch.apiId, launch]));
  const updates = [];

  for (const launch of nextList) {
    const prior = prevMap.get(launch.apiId);
    const title = getLaunchTitle(launch);

    if (!prior) {
      updates.push({
        id: `${atMs}-scheduled-${launch.apiId}`,
        kind: "scheduled",
        atMs,
        apiId: launch.apiId,
        title,
        detail: "Added to the queue",
      });
      continue;
    }

    if (!isLive(prior) && isLive(launch)) {
      updates.push({
        id: `${atMs}-webcast-${launch.apiId}`,
        kind: "webcast",
        atMs,
        apiId: launch.apiId,
        title,
        detail: "Webcast is live now",
      });
    }

    if (prior.net !== launch.net) {
      const from = formatNetChip(prior.net);
      const to = formatNetChip(launch.net);
      updates.push({
        id: `${atMs}-rescheduled-${launch.apiId}`,
        kind: "rescheduled",
        atMs,
        apiId: launch.apiId,
        title,
        detail:
          from && to ? `${from} → ${to}` : "Launch time updated",
      });
    }

    const prevStatus = statusOf(prior);
    const nextStatus = statusOf(launch);
    if (prevStatus && nextStatus && prevStatus !== nextStatus) {
      updates.push({
        id: `${atMs}-status-${launch.apiId}`,
        kind: "status",
        atMs,
        apiId: launch.apiId,
        title,
        detail: `${prevStatus} → ${nextStatus}`,
      });
    }
  }

  for (const launch of prevList) {
    if (nextMap.has(launch.apiId)) continue;
    updates.push({
      id: `${atMs}-removed-${launch.apiId}`,
      kind: "removed",
      atMs,
      apiId: launch.apiId,
      title: getLaunchTitle(launch),
      detail: "Removed from the queue",
    });
  }

  return updates.sort(
    (a, b) =>
      KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind] ||
      a.title.localeCompare(b.title),
  );
}

module.exports = { diffLaunchBoard, getLaunchTitle };
