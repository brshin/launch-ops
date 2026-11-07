import { describe, expect, it } from "vitest";
import type { Launch } from "../types/launch";
import type { LaunchLocation } from "../types/location";
import {
  buildConsoleOverview,
  formatCompactCount,
  formatNextLaunchHeadline,
} from "./consoleOverview";

const NOW = Date.parse("2026-08-19T12:00:00.000Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function netFromNow(offsetMs: number): string {
  return new Date(NOW + offsetMs).toISOString();
}

function makeLaunch(
  overrides: Partial<Launch> & {
    apiId: string;
    net: string;
    providerAbbrev?: string;
    orbit?: string;
    statusAbbrev?: string;
  },
): Launch {
  const {
    apiId,
    net,
    providerAbbrev = "SpX",
    orbit = "LEO",
    statusAbbrev = "Go",
    ...rest
  } = overrides;
  return {
    apiId,
    name: rest.name ?? `Mission ${apiId}`,
    status: rest.status ?? { abbrev: statusAbbrev },
    last_updated: net,
    net,
    window_start: net,
    window_end: net,
    image: rest.image ?? ({} as Launch["image"]),
    launch_service_provider: rest.launch_service_provider ?? {
      url: "",
      name: providerAbbrev,
      abbrev: providerAbbrev,
      type: { name: "Commercial" },
    },
    rocket: rest.rocket ?? ({
      configuration: { name: "Falcon 9", full_name: "Falcon 9 Block 5" },
    } as Launch["rocket"]),
    mission: rest.mission ?? ({
      name: `Mission ${apiId}`,
      type: "Communications",
      orbit: { name: orbit, abbrev: orbit },
    } as Launch["mission"]),
    pad: rest.pad ?? ({
      name: "SLC-40",
      location: {
        id: 1,
        name: "Cape Canaveral, FL, USA",
        country: { alpha_2_code: "US", name: "USA" },
      },
    } as Launch["pad"]),
    webcast_live: rest.webcast_live,
    vid_urls: rest.vid_urls,
    net_precision: rest.net_precision ?? { abbrev: "MIN" },
  } as Launch;
}

const locations: LaunchLocation[] = [
  {
    apiId: 1,
    name: "Cape Canaveral SFS, FL, USA",
    active: true,
    country: { name: "USA" },
    description: null,
    image: null,
    map_image: null,
    longitude: -80.5,
    latitude: 28.5,
    timezone_name: "America/New_York",
    total_launch_count: 1132,
    total_landing_count: 83,
    celestial_body: { id: 1, name: "Earth" },
  },
  {
    apiId: 2,
    name: "Plesetsk Cosmodrome, Russian Federation",
    active: true,
    country: { name: "Russia" },
    description: null,
    image: null,
    map_image: null,
    longitude: 40.5,
    latitude: 62.9,
    timezone_name: "Europe/Moscow",
    total_launch_count: 1688,
    total_landing_count: 0,
    celestial_body: { id: 1, name: "Earth" },
  },
];

describe("buildConsoleOverview", () => {
  it("exposes schedule stats, plain orbits, and next launch", () => {
    const launches = [
      makeLaunch({ apiId: "a", net: netFromNow(2 * HOUR), providerAbbrev: "SpX" }),
      makeLaunch({
        apiId: "b",
        net: netFromNow(3 * DAY),
        providerAbbrev: "SpX",
        orbit: "SSO",
        statusAbbrev: "TBD",
      }),
      makeLaunch({
        apiId: "c",
        net: netFromNow(10 * DAY),
        providerAbbrev: "CASC",
      }),
    ];

    const model = buildConsoleOverview(launches, locations, NOW);

    expect(model.upcomingCount).toBe(3);
    expect(model.weekCount).toBe(2);
    expect(model.sitesLit).toBeGreaterThan(0);
    expect(model.goCount).toBe(2);
    expect(model.lifetimeAttempts).toBe(1132 + 1688);
    expect(model.nextLaunch?.apiId).toBe("a");
    expect(model.providers.map((row) => row.label)).toEqual(["SpX", "CASC"]);
    expect(model.orbits.map((row) => row.label)).toEqual([
      "Low Earth",
      "Sun-Sync",
    ]);
  });
});

describe("formatNextLaunchHeadline", () => {
  it("formats minute/hour/day ETAs without seconds", () => {
    expect(
      formatNextLaunchHeadline(
        makeLaunch({ apiId: "m", net: netFromNow(21 * MINUTE) }),
        NOW,
      ),
    ).toEqual({ lead: "Next launch in", emphasis: "21 min" });

    expect(
      formatNextLaunchHeadline(
        makeLaunch({ apiId: "h", net: netFromNow(6 * HOUR) }),
        NOW,
      ),
    ).toEqual({ lead: "Next launch in", emphasis: "6 hr" });

    expect(
      formatNextLaunchHeadline(
        makeLaunch({ apiId: "d", net: netFromNow(2 * DAY + 4 * HOUR) }),
        NOW,
      ),
    ).toEqual({ lead: "Next launch in", emphasis: "2d 4h" });
  });

  it("handles hold and provisional NET", () => {
    expect(
      formatNextLaunchHeadline(
        makeLaunch({
          apiId: "hold",
          net: netFromNow(HOUR),
          statusAbbrev: "Hold",
        }),
        NOW,
      ),
    ).toEqual({ lead: "Next launch", emphasis: "On hold" });

    expect(
      formatNextLaunchHeadline(
        makeLaunch({
          apiId: "tbd",
          net: netFromNow(HOUR),
          statusAbbrev: "TBD",
        }),
        NOW,
      ),
    ).toEqual({ lead: "Next launch", emphasis: "Time TBD" });
  });
});

describe("formatCompactCount", () => {
  it("compacts large totals", () => {
    expect(formatCompactCount(42)).toBe("42");
    expect(formatCompactCount(2820)).toBe("2.8k");
    expect(formatCompactCount(12000)).toBe("12k");
  });
});
