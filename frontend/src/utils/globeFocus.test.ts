import { describe, expect, it } from "vitest";
import {
  faceYawForLatLon,
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

describe("padFocusFromLaunch", () => {
  it("reads finite pad coords", () => {
    expect(
      padFocusFromLaunch({ pad: { latitude: 34.632, longitude: -120.611 } }),
    ).toEqual({ latitude: 34.632, longitude: -120.611 });
  });

  it("rejects missing or out-of-range coords", () => {
    expect(padFocusFromLaunch(null)).toBeNull();
    expect(padFocusFromLaunch({ pad: { latitude: 91, longitude: 0 } })).toBeNull();
    expect(padFocusFromLaunch({ pad: { latitude: "x", longitude: 0 } })).toBeNull();
  });
});

describe("padSitesFromLaunches", () => {
  it("dedupes launches that share a pad", () => {
    const sites = padSitesFromLaunches([
      { pad: { latitude: 34.632, longitude: -120.611 } },
      { pad: { latitude: 34.632, longitude: -120.611 } },
      { pad: { latitude: 28.608, longitude: -80.604 } },
    ]);
    expect(sites).toHaveLength(2);
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
