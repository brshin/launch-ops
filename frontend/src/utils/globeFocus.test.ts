import { describe, expect, it } from "vitest";
import {
  enrichPadFocus,
  faceYawForLatLon,
  globeSitesFromLocations,
  hoverLabelsFromLocation,
  hoverLabelsFromPad,
  latLonToUnit,
  padFocusFromLaunch,
  padSitesFromLaunches,
  samePad,
  shortestAngleDelta,
  globeSiteStatLine,
  launchesAtLocation,
  soonestLaunchAtPad,
  upcomingCountByLocationId,
} from "./globeFocus";
import type { LaunchLocation } from "../types/location";

function loc(partial: Partial<LaunchLocation> & Pick<LaunchLocation, "apiId" | "name">): LaunchLocation {
  return {
    active: true,
    country: { name: "USA" },
    description: null,
    image: null,
    map_image: null,
    longitude: -120.52,
    latitude: 34.75,
    timezone_name: null,
    total_launch_count: 0,
    total_landing_count: 0,
    celestial_body: { id: 1, name: "Earth" },
    ...partial,
  };
}

describe("latLonToUnit", () => {
  it("puts Greenwich on +X", () => {
    const p = latLonToUnit(0, 0);
    expect(p.x).toBeCloseTo(1, 5);
    expect(p.y).toBeCloseTo(0, 5);
    expect(p.z).toBeCloseTo(0, 5);
  });

  it("puts 90°W on +Z", () => {
    const p = latLonToUnit(0, -90);
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.z).toBeCloseTo(1, 5);
  });
});

describe("faceYawForLatLon", () => {
  it("yaws Greenwich onto the camera face", () => {
    expect(faceYawForLatLon(0, 0)).toBeCloseTo(-Math.PI / 2, 5);
  });

  it("leaves a +Z site at yaw 0", () => {
    expect(faceYawForLatLon(0, -90)).toBeCloseTo(0, 5);
  });
});

describe("shortestAngleDelta", () => {
  it("wraps across the −π / π seam", () => {
    expect(shortestAngleDelta(3, -3)).toBeCloseTo(Math.PI * 2 - 6, 5);
    expect(shortestAngleDelta(-3, 3)).toBeCloseTo(-(Math.PI * 2 - 6), 5);
  });
});

describe("hoverLabelsFromPad", () => {
  it("splits site and place from location", () => {
    expect(
      hoverLabelsFromPad({
        name: "Space Launch Complex 4E",
        location: { name: "Vandenberg SFB, CA, USA" },
      }),
    ).toEqual({
      siteLabel: "Vandenberg SFB",
      placeLabel: "California, USA",
    });
  });

  it("falls back to pad name", () => {
    expect(hoverLabelsFromPad({ name: "LC-39A" })).toEqual({
      siteLabel: "LC-39A",
      placeLabel: null,
    });
  });
});

describe("padFocusFromLaunch", () => {
  it("reads finite pad coords, site, and place", () => {
    expect(
      padFocusFromLaunch({
        pad: {
          latitude: 34.632,
          longitude: -120.611,
          location: { name: "Vandenberg SFB, CA, USA" },
        },
      }),
    ).toEqual({
      latitude: 34.632,
      longitude: -120.611,
      siteLabel: "Vandenberg SFB",
      placeLabel: "California, USA",
      upcomingCount: 1,
      totalLaunchCount: 0,
    });
  });

  it("rejects missing or out-of-range coords", () => {
    expect(padFocusFromLaunch(null)).toBeNull();
    expect(padFocusFromLaunch({ pad: { latitude: 91, longitude: 0 } })).toBeNull();
    expect(padFocusFromLaunch({ pad: { latitude: "x", longitude: 0 } })).toBeNull();
  });
});

describe("padSitesFromLaunches", () => {
  it("dedupes launches that share a pad and counts upcoming", () => {
    const sites = padSitesFromLaunches([
      {
        pad: {
          latitude: 34.632,
          longitude: -120.611,
          location: { name: "Vandenberg SFB, CA, USA" },
        },
      },
      {
        pad: {
          latitude: 34.632,
          longitude: -120.611,
          location: { name: "Vandenberg SFB, CA, USA" },
        },
      },
      {
        pad: {
          latitude: 28.608,
          longitude: -80.604,
          location: { name: "Kennedy Space Center, FL, USA" },
        },
      },
    ]);
    expect(sites).toHaveLength(2);
    const vandy = sites.find((s) => s.siteLabel === "Vandenberg SFB");
    expect(vandy?.upcomingCount).toBe(2);
  });
});

describe("samePad", () => {
  it("matches pads within the constellation key precision", () => {
    expect(
      samePad(
        { latitude: 34.632, longitude: -120.611 },
        { latitude: 34.6321, longitude: -120.6112 },
      ),
    ).toBe(true);
    expect(
      samePad(
        { latitude: 34.632, longitude: -120.611 },
        { latitude: 28.608, longitude: -80.604 },
      ),
    ).toBe(false);
  });
});

describe("enrichPadFocus", () => {
  it("copies upcoming count from the constellation entry", () => {
    const pads = padSitesFromLaunches([
      {
        pad: {
          latitude: 34.632,
          longitude: -120.611,
          location: { name: "Vandenberg SFB, CA, USA" },
        },
      },
      {
        pad: {
          latitude: 34.632,
          longitude: -120.611,
          location: { name: "Vandenberg SFB, CA, USA" },
        },
      },
    ]);
    const enriched = enrichPadFocus(
      { latitude: 34.632, longitude: -120.611, siteLabel: "Vandenberg SFB" },
      pads,
    );
    expect(enriched?.upcomingCount).toBe(2);
  });
});

describe("hoverLabelsFromLocation", () => {
  it("splits site and place from the catalog name", () => {
    expect(
      hoverLabelsFromLocation({
        name: "Vandenberg SFB, CA, USA",
        country: { name: "USA" },
      }),
    ).toEqual({
      siteLabel: "Vandenberg SFB",
      placeLabel: "California, USA",
    });
  });

  it("falls back to country when the name has no place tail", () => {
    expect(
      hoverLabelsFromLocation({
        name: "Baikonur",
        country: { name: "Kazakhstan" },
      }),
    ).toEqual({
      siteLabel: "Baikonur",
      placeLabel: "Kazakhstan",
    });
  });

  it("prefers the short country when the name tail is a country alias", () => {
    expect(
      hoverLabelsFromLocation({
        name: "Wenchang Space Launch Site, People's Republic of China",
        country: { name: "China" },
      }),
    ).toEqual({
      siteLabel: "Wenchang Space Launch Site",
      placeLabel: "China",
    });
  });
});

describe("upcomingCountByLocationId", () => {
  it("counts launches by pad.location.id", () => {
    const counts = upcomingCountByLocationId([
      { pad: { location: { id: 11 } } },
      { pad: { location: { id: 11 } } },
      { pad: { location: { id: 8 } } },
      { pad: { location: { id: null } } },
    ]);
    expect(counts.get(11)).toBe(2);
    expect(counts.get(8)).toBe(1);
  });
});

describe("globeSitesFromLocations", () => {
  it("keeps active Earth sites with coords and skips Moon / inactive", () => {
    const sites = globeSitesFromLocations(
      [
        loc({ apiId: 11, name: "Vandenberg SFB, CA, USA" }),
        loc({
          apiId: 99,
          name: "Mons Rümker, Moon",
          active: false,
          celestial_body: { id: 2, name: "Moon" },
          latitude: 40,
          longitude: -40,
        }),
        loc({
          apiId: 12,
          name: "Tonghae",
          active: false,
          latitude: 40.85,
          longitude: 129.66,
        }),
      ],
      [],
    );
    expect(sites).toHaveLength(1);
    expect(sites[0]).toMatchObject({
      locationApiId: 11,
      siteLabel: "Vandenberg SFB",
      placeLabel: "California, USA",
      upcomingCount: 0,
      totalLaunchCount: 0,
    });
  });

  it("excludes sites that already have upcoming pad markers", () => {
    const sites = globeSitesFromLocations(
      [
        loc({ apiId: 11, name: "Vandenberg SFB, CA, USA" }),
        loc({
          apiId: 17,
          name: "Jiuquan Satellite Launch Center, People's Republic of China",
          latitude: 40.96,
          longitude: 100.29,
          country: { name: "China" },
        }),
      ],
      [{ pad: { location: { id: 11 } } }],
    );
    expect(sites.map((s) => s.locationApiId)).toEqual([17]);
  });

  it("can keep upcoming sites when excludeWithUpcoming is false", () => {
    const sites = globeSitesFromLocations(
      [loc({ apiId: 11, name: "Vandenberg SFB, CA, USA" })],
      [{ pad: { location: { id: 11 } } }, { pad: { location: { id: 11 } } }],
      { excludeWithUpcoming: false },
    );
    expect(sites).toHaveLength(1);
    expect(sites[0].upcomingCount).toBe(2);
  });
});

describe("launchesAtLocation", () => {
  it("returns queue launches for a location id sorted by NET", () => {
    const rows = launchesAtLocation(
      [
        {
          apiId: "b",
          net: "2026-11-08T00:00:00Z",
          pad: { location: { id: 11 } },
        },
        {
          apiId: "a",
          net: "2026-11-07T00:00:00Z",
          pad: { location: { id: 11 } },
        },
        {
          apiId: "other",
          net: "2026-11-06T00:00:00Z",
          pad: { location: { id: 8 } },
        },
      ],
      11,
    );
    expect(rows.map((r) => r.apiId)).toEqual(["a", "b"]);
  });
});

describe("globeSiteStatLine", () => {
  it("prefers upcoming over lifetime total", () => {
    expect(globeSiteStatLine(2, 400)).toBe("2 upcoming");
  });

  it("falls back to lifetime total when nothing is upcoming", () => {
    expect(globeSiteStatLine(0, 400)).toBe("400 total");
    expect(globeSiteStatLine(0, 0)).toBe("0 total");
  });
});

describe("soonestLaunchAtPad", () => {
  const pad = {
    latitude: 34.632,
    longitude: -120.611,
    siteLabel: "Vandenberg SFB",
  };

  it("returns null when no launch matches the pad", () => {
    expect(
      soonestLaunchAtPad(
        [
          {
            apiId: "a",
            net: "2026-11-07T00:00:00Z",
            pad: { latitude: 28.608, longitude: -80.604 },
          },
        ],
        pad,
        Date.parse("2026-11-06T00:00:00Z"),
      ),
    ).toBeNull();
  });

  it("prefers the soonest upcoming NET at that pad", () => {
    const now = Date.parse("2026-11-06T12:00:00Z");
    const pick = soonestLaunchAtPad(
      [
        {
          apiId: "later",
          net: "2026-11-08T00:00:00Z",
          pad: {
            latitude: 34.632,
            longitude: -120.611,
            location: { name: "Vandenberg SFB, CA, USA" },
          },
        },
        {
          apiId: "sooner",
          net: "2026-11-07T00:00:00Z",
          pad: {
            latitude: 34.632,
            longitude: -120.611,
            location: { name: "Vandenberg SFB, CA, USA" },
          },
        },
        {
          apiId: "past",
          net: "2026-11-05T00:00:00Z",
          pad: {
            latitude: 34.632,
            longitude: -120.611,
            location: { name: "Vandenberg SFB, CA, USA" },
          },
        },
      ],
      pad,
      now,
    );
    expect(pick?.apiId).toBe("sooner");
  });

  it("falls back to the earliest NET when all are in the past", () => {
    const now = Date.parse("2026-11-10T00:00:00Z");
    const pick = soonestLaunchAtPad(
      [
        {
          apiId: "b",
          net: "2026-11-08T00:00:00Z",
          pad: { latitude: 34.632, longitude: -120.611 },
        },
        {
          apiId: "a",
          net: "2026-11-05T00:00:00Z",
          pad: { latitude: 34.632, longitude: -120.611 },
        },
      ],
      pad,
      now,
    );
    expect(pick?.apiId).toBe("a");
  });
});
