import { describe, expect, it } from "vitest";
import {
  classifyWatchKind,
  isOfficialVid,
  isWebcastLive,
  pickWatchTarget,
  youtubeEmbedUrl,
  youtubeVideoId,
} from "./watchTarget";

const NOW = Date.parse("2026-09-18T20:00:00.000Z");
const FUTURE_NET = "2026-09-19T03:15:00.000Z";
const PAST_NET = "2026-09-18T01:00:00.000Z";

const rocketLabYt = {
  url: "https://www.youtube.com/watch?v=AnN8Pj8WvSo",
  live: false,
  type: { name: "Official Webcast" },
  publisher: "Rocket Lab",
};

const nsfYt = {
  url: "https://www.youtube.com/watch?v=9gDxG-pm1Zo",
  live: false,
  type: { name: "Unofficial Webcast" },
  publisher: "NASASpaceflight",
};

const spacexX = {
  url: "https://x.com/i/broadcasts/1nxnRBXEladxO",
  live: false,
  type: { name: "Official Webcast" },
  publisher: "SpaceX",
};

describe("classifyWatchKind", () => {
  it("classifies youtube, x, and other hosts", () => {
    expect(classifyWatchKind("https://youtu.be/AnN8Pj8WvSo")).toBe("youtube");
    expect(classifyWatchKind("https://www.youtube.com/watch?v=AnN8Pj8WvSo")).toBe(
      "youtube",
    );
    expect(classifyWatchKind("https://x.com/i/broadcasts/1nxnRBXEladxO")).toBe("x");
    expect(classifyWatchKind("https://twitter.com/i/broadcasts/abc")).toBe("x");
    expect(classifyWatchKind("https://plus.nasa.gov/scheduled-video/foo")).toBe(
      "other",
    );
  });
});

describe("isOfficialVid", () => {
  it("matches Official at the start, not Unofficial", () => {
    expect(isOfficialVid({ type: { name: "Official Webcast" } })).toBe(true);
    expect(isOfficialVid({ type: "Official Webcast" })).toBe(true);
    expect(isOfficialVid({ type: { name: "Unofficial Webcast" } })).toBe(false);
    expect(isOfficialVid({ type: { name: "Unofficial Re-stream" } })).toBe(false);
  });
});

describe("youtubeVideoId / youtubeEmbedUrl", () => {
  it("parses watch, youtu.be, and embed URLs", () => {
    expect(youtubeVideoId("https://www.youtube.com/watch?v=AnN8Pj8WvSo")).toBe(
      "AnN8Pj8WvSo",
    );
    expect(youtubeVideoId("https://youtu.be/AnN8Pj8WvSo")).toBe("AnN8Pj8WvSo");
    expect(
      youtubeVideoId("https://www.youtube.com/embed/AnN8Pj8WvSo"),
    ).toBe("AnN8Pj8WvSo");
    expect(youtubeEmbedUrl("https://youtu.be/AnN8Pj8WvSo")).toBe(
      "https://www.youtube-nocookie.com/embed/AnN8Pj8WvSo",
    );
  });
});

describe("isWebcastLive", () => {
  it("is true from launch webcast_live or any vid_url live flag", () => {
    expect(isWebcastLive({ webcastLive: true, vidUrls: [] })).toBe(true);
    expect(
      isWebcastLive({
        webcastLive: false,
        vidUrls: [{ url: "https://youtu.be/AnN8Pj8WvSo", live: true }],
      }),
    ).toBe(true);
    expect(
      isWebcastLive({ webcastLive: false, vidUrls: [rocketLabYt] }),
    ).toBe(false);
  });
});

describe("pickWatchTarget", () => {
  it("returns null when there are no usable urls", () => {
    expect(pickWatchTarget({ vidUrls: [], now: NOW })).toBeNull();
    expect(pickWatchTarget({ vidUrls: [{ live: true }], now: NOW })).toBeNull();
    expect(pickWatchTarget({ now: NOW })).toBeNull();
  });

  it("picks official YouTube as watch when posted but not live", () => {
    expect(
      pickWatchTarget({
        vidUrls: [rocketLabYt],
        net: FUTURE_NET,
        now: NOW,
      }),
    ).toMatchObject({
      kind: "youtube",
      mode: "watch",
      live: false,
      official: true,
      publisher: "Rocket Lab",
      embedUrl: "https://www.youtube-nocookie.com/embed/AnN8Pj8WvSo",
      url: rocketLabYt.url,
    });
  });

  it("prefers YouTube over official X so the pane can embed", () => {
    expect(
      pickWatchTarget({
        vidUrls: [spacexX, nsfYt],
        net: FUTURE_NET,
        now: NOW,
      }),
    ).toMatchObject({
      kind: "youtube",
      url: nsfYt.url,
    });
  });

  it("prefers official YouTube over unofficial when neither is live", () => {
    expect(
      pickWatchTarget({
        vidUrls: [nsfYt, rocketLabYt],
        net: FUTURE_NET,
        now: NOW,
      }),
    ).toMatchObject({
      url: rocketLabYt.url,
      official: true,
    });
  });

  it("prefers a live unofficial YouTube over a waiting official one", () => {
    expect(
      pickWatchTarget({
        vidUrls: [rocketLabYt, { ...nsfYt, live: true }],
        net: FUTURE_NET,
        now: NOW,
      }),
    ).toMatchObject({
      url: nsfYt.url,
      live: true,
      mode: "live",
      official: false,
    });
  });

  it("returns X with no embed when that is the only url", () => {
    expect(
      pickWatchTarget({
        vidUrls: [spacexX],
        net: FUTURE_NET,
        now: NOW,
      }),
    ).toMatchObject({
      kind: "x",
      url: spacexX.url,
      mode: "watch",
      live: false,
      publisher: "SpaceX",
    });
    expect(
      pickWatchTarget({
        vidUrls: [spacexX],
        net: FUTURE_NET,
        now: NOW,
      })?.embedUrl,
    ).toBeUndefined();
  });

  it("treats launch webcast_live as live even if the url flag is false", () => {
    expect(
      pickWatchTarget({
        vidUrls: [rocketLabYt],
        webcastLive: true,
        net: FUTURE_NET,
        now: NOW,
      }),
    ).toMatchObject({
      live: true,
      mode: "live",
    });
  });

  it("uses replay after NET or a flown status when not live", () => {
    expect(
      pickWatchTarget({
        vidUrls: [rocketLabYt],
        net: PAST_NET,
        now: NOW,
      }),
    ).toMatchObject({ mode: "replay", live: false });

    expect(
      pickWatchTarget({
        vidUrls: [rocketLabYt],
        net: FUTURE_NET,
        status: "Success",
        now: NOW,
      }),
    ).toMatchObject({ mode: "replay" });

    expect(
      pickWatchTarget({
        vidUrls: [rocketLabYt],
        net: FUTURE_NET,
        status: "In Flight",
        now: NOW,
      }),
    ).toMatchObject({ mode: "replay" });
  });
});
