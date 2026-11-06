import { describe, expect, it } from "vitest";
import {
  enrichPadFocus,
  faceYawForLatLon,
  hoverLabelsFromPad,
  latLonToUnit,
  padFocusFromLaunch,
  padSitesFromLaunches,
  samePad,
  shortestAngleDelta,
} from "./globeFocus";

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
