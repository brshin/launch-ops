import type { VidUrl } from "../types/launch";

export type WatchKind = "youtube" | "x" | "other";
export type WatchMode = "live" | "watch" | "replay";

export interface WatchTarget {
  kind: WatchKind;
  url: string;
  embedUrl?: string;
  live: boolean;
  mode: WatchMode;
  official: boolean;
}

const KIND_RANK: Record<WatchKind, number> = {
  youtube: 0,
  x: 1,
  other: 2,
};

const YOUTUBE_ID = /^[\w-]{11}$/;

const FLOWN_STATUS = new Set([
  "SUCCESS",
  "IN FLIGHT",
  "FAILURE",
  "PARTIAL FAILURE",
]);

export function classifyWatchKind(url: string): WatchKind {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "other";
  }

  if (
    host === "youtu.be" ||
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    return "youtube";
  }
  if (
    host === "x.com" ||
    host === "twitter.com" ||
    host === "mobile.twitter.com" ||
    host === "mobile.x.com"
  ) {
    return "x";
  }
  return "other";
}

/** Official Webcast vs Unofficial — do not substring-match "official". */
export function isOfficialVid(entry: VidUrl): boolean {
  const raw =
    typeof entry.type === "string" ? entry.type : entry.type?.name ?? "";
  return /^official\b/i.test(raw.trim());
}

export function youtubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const path = parsed.pathname.replace(/\/+$/, "");

  if (host === "youtu.be") {
    const id = path.split("/").filter(Boolean)[0];
    return id && YOUTUBE_ID.test(id) ? id : null;
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    const v = parsed.searchParams.get("v");
    if (v && YOUTUBE_ID.test(v)) return v;

    const parts = path.split("/").filter(Boolean);
    const nest = ["embed", "shorts", "live", "v"];
    if (parts.length >= 2 && nest.includes(parts[0])) {
      const id = parts[1];
      return YOUTUBE_ID.test(id) ? id : null;
    }
  }

  return null;
}

export function youtubeEmbedUrl(url: string): string | undefined {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
}

function toMs(input: string | Date | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  const ms = (input instanceof Date ? input : new Date(input)).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function isReplayWindow(input: {
  net?: string | Date | null;
  status?: string | null;
  now: number;
}): boolean {
  const status = (input.status ?? "").trim().toUpperCase();
  if (FLOWN_STATUS.has(status)) return true;
  const netMs = toMs(input.net);
  return netMs != null && netMs <= input.now;
}

function watchMode(input: {
  live: boolean;
  net?: string | Date | null;
  status?: string | null;
  now: number;
}): WatchMode {
  if (input.live) return "live";
  if (isReplayWindow(input)) return "replay";
  return "watch";
}

interface RankedVid {
  url: string;
  kind: WatchKind;
  live: boolean;
  official: boolean;
  index: number;
}

function rankVid(a: RankedVid, b: RankedVid): number {
  return (
    KIND_RANK[a.kind] - KIND_RANK[b.kind] ||
    Number(b.live) - Number(a.live) ||
    Number(b.official) - Number(a.official) ||
    a.index - b.index
  );
}

/** True when LL says a webcast is on, or any vid_url is flagged live. */
export function isWebcastLive(input: {
  webcastLive?: boolean;
  vidUrls?: VidUrl[] | null;
}): boolean {
  if (input.webcastLive) return true;
  return (input.vidUrls ?? []).some((entry) => Boolean(entry?.live));
}

/**
 * Pick one webcast for the camera pane.
 * YouTube wins (in-app embed); X/other are outbound only.
 */
export function pickWatchTarget(input: {
  vidUrls?: VidUrl[] | null;
  webcastLive?: boolean;
  net?: string | Date | null;
  status?: string | null;
  now?: number | Date;
}): WatchTarget | null {
  const now = toMs(input.now) ?? Date.now();
  const ranked: RankedVid[] = [];

  for (let i = 0; i < (input.vidUrls ?? []).length; i++) {
    const entry = input.vidUrls![i];
    const url = entry?.url?.trim();
    if (!url) continue;
    ranked.push({
      url,
      kind: classifyWatchKind(url),
      live: Boolean(entry.live),
      official: isOfficialVid(entry),
      index: i,
    });
  }

  if (ranked.length === 0) return null;

  ranked.sort(rankVid);
  const best = ranked[0];
  const live = Boolean(best.live || input.webcastLive);
  const mode = watchMode({
    live,
    net: input.net,
    status: input.status,
    now,
  });

  return {
    kind: best.kind,
    url: best.url,
    embedUrl: best.kind === "youtube" ? youtubeEmbedUrl(best.url) : undefined,
    live,
    mode,
    official: best.official,
  };
}
