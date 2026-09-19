const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

/** Ignore brief app switches so the embed is not interrupted. */
export const LIVE_RESYNC_MIN_AWAY_MS = 2000;
/** Live-head lag that is still "now" (YouTube latency), not a freeze. */
export const LIVE_RESYNC_BEHIND_SEC = 1.5;

export const YT_PLAYING = 1;
export const YT_BUFFERING = 3;

export type LiveResyncPlan = "skip" | "play" | "seek" | "play-seek";

export type YtPlayer = {
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

type YtPlayerVars = {
  autoplay?: 0 | 1;
  rel?: 0 | 1;
  modestbranding?: 0 | 1;
  playsinline?: 0 | 1;
  origin?: string;
};

type YtNamespace = {
  Player: new (
    el: HTMLElement | string,
    opts?: {
      host?: string;
      videoId?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: YtPlayerVars;
      events?: { onReady?: (event: { target: YtPlayer }) => void };
    },
  ) => YtPlayer;
};

type YoutubeWindow = Window & {
  YT?: YtNamespace;
  onYouTubeIframeAPIReady?: () => void;
};

export function planLiveResync(input: {
  awayMs: number;
  playerState: number;
  delaySec: number;
}): LiveResyncPlan {
  if (input.awayMs < LIVE_RESYNC_MIN_AWAY_MS) return "skip";
  const playing =
    input.playerState === YT_PLAYING || input.playerState === YT_BUFFERING;
  const behind = input.delaySec > LIVE_RESYNC_BEHIND_SEC;
  if (playing && !behind) return "skip";
  if (playing) return "seek";
  return behind ? "play-seek" : "play";
}

export function applyLiveResync(player: YtPlayer, awayMs: number): LiveResyncPlan {
  let state = Number.NaN;
  let current = 0;
  let duration = 0;
  try {
    state = player.getPlayerState();
    current = player.getCurrentTime();
    duration = player.getDuration();
  } catch {
    return "skip";
  }
  if (!Number.isFinite(state)) return "skip";
  const delaySec =
    Number.isFinite(current) && Number.isFinite(duration)
      ? Math.max(0, duration - current)
      : 0;
  const plan = planLiveResync({ awayMs, playerState: state, delaySec });
  try {
    if (plan === "seek" || plan === "play-seek") {
      if (duration > 0) player.seekTo(duration, true);
    }
    if (plan === "play" || plan === "play-seek") {
      player.playVideo();
    }
  } catch {
    return "skip";
  }
  return plan;
}

function ytApi(): YtNamespace | undefined {
  return (window as YoutubeWindow).YT;
}

let apiReady: Promise<void> | null = null;

export function loadYoutubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (ytApi()?.Player) return Promise.resolve();
  if (apiReady) return apiReady;

  apiReady = new Promise((resolve) => {
    const w = window as YoutubeWindow;
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = IFRAME_API_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    if (ytApi()?.Player) resolve();
  });

  return apiReady;
}

export function createYoutubePlayer(
  host: HTMLElement,
  videoId: string,
): Promise<YtPlayer> {
  return loadYoutubeIframeApi().then(
    () =>
      new Promise((resolve, reject) => {
        const Player = ytApi()?.Player;
        if (!Player) {
          reject(new Error("YouTube IFrame API missing"));
          return;
        }
        const player = new Player(host, {
          host: "https://www.youtube-nocookie.com",
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => resolve(event.target),
          },
        });
        void player;
      }),
  );
}
