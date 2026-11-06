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
