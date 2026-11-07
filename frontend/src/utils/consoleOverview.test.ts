import { describe, expect, it } from "vitest";
import type { Launch } from "../types/launch";
import type { LaunchLocation } from "../types/location";
import { buildConsoleOverview } from "./consoleOverview";

const NOW = Date.parse("2026-08-19T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;
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
  },
): Launch {
  const {
    apiId,
    net,
    providerAbbrev = "SpX",
    orbit = "LEO",
    ...rest
  } = overrides;
  return {
    apiId,
    name: rest.name ?? `Mission ${apiId}`,
    status: rest.status ?? { abbrev: "Go" },
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
    apiId: 99,
    name: "Shackleton Crater, Moon",
    active: true,
    country: null,
    description: null,
    image: null,
    map_image: null,
    longitude: 0,
    latitude: -89,
    timezone_name: null,
    total_launch_count: 0,
    total_landing_count: 0,
    celestial_body: { id: 2, name: "Moon" },
  },
];

describe("buildConsoleOverview", () => {
  it("exposes clear board stats and skips year/Go jargon", () => {
    const launches = [
      makeLaunch({ apiId: "a", net: netFromNow(2 * HOUR), providerAbbrev: "SpX" }),
      makeLaunch({
        apiId: "b",
        net: netFromNow(3 * DAY),
        providerAbbrev: "SpX",
        orbit: "SSO",
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
    expect(model.sitesLit).toBe(1);
    expect(model.providers[0]).toEqual({ label: "SpX", count: 2 });
    expect(model.orbits.map((row) => row.label)).toEqual(["LEO", "SSO"]);
    expect(model.earthActive).toBe(1);
    expect(model.lunarSites).toBe(1);
    expect(model.pulse).toMatch(/7 days|select a launch/i);
  });
});
