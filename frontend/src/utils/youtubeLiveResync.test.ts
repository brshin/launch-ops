import { describe, expect, it } from "vitest";
import {
  LIVE_RESYNC_BEHIND_SEC,
  LIVE_RESYNC_MIN_AWAY_MS,
  YT_BUFFERING,
  YT_PLAYING,
  planLiveResync,
} from "./youtubeLiveResync";

const PAUSED = 2;

describe("planLiveResync", () => {
  it("skips brief tab switches even if the clock looks behind", () => {
    expect(
      planLiveResync({
        awayMs: LIVE_RESYNC_MIN_AWAY_MS - 1,
        playerState: YT_PLAYING,
        delaySec: 30,
      }),
    ).toBe("skip");
  });

  it("leaves a playing live head alone after a longer hide", () => {
    expect(
      planLiveResync({
        awayMs: LIVE_RESYNC_MIN_AWAY_MS,
        playerState: YT_PLAYING,
        delaySec: LIVE_RESYNC_BEHIND_SEC,
      }),
    ).toBe("skip");
    expect(
      planLiveResync({
        awayMs: 8_000,
        playerState: YT_BUFFERING,
        delaySec: 0.2,
      }),
    ).toBe("skip");
  });

  it("seeks a playing player that froze behind the live head", () => {
    expect(
      planLiveResync({
        awayMs: 8_000,
        playerState: YT_PLAYING,
        delaySec: LIVE_RESYNC_BEHIND_SEC + 0.1,
      }),
    ).toBe("seek");
  });

  it("resumes a paused player, seeking only when behind", () => {
    expect(
      planLiveResync({
        awayMs: 8_000,
        playerState: PAUSED,
        delaySec: 0.4,
      }),
    ).toBe("play");
    expect(
      planLiveResync({
        awayMs: 8_000,
        playerState: PAUSED,
        delaySec: 12,
      }),
    ).toBe("play-seek");
  });
});
