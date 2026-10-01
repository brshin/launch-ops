import { describe, expect, it } from "vitest";
import { isDaylit, solarAttitude } from "./solarAttitude";

const DEG = 180 / Math.PI;

describe("solarAttitude", () => {
  it("puts the sun near Greenwich at noon UTC", () => {
    const { subsolarLongitude, declination } = solarAttitude(new Date("2026-03-20T12:00:00.000Z"));
    expect(subsolarLongitude * DEG).toBeGreaterThan(-8);
    expect(subsolarLongitude * DEG).toBeLessThan(8);
    expect(Math.abs(declination * DEG)).toBeLessThan(4);
  });

  it("puts the June sun in the northern hemisphere", () => {
    const { declination } = solarAttitude(new Date("2026-06-21T12:00:00.000Z"));
    expect(declination * DEG).toBeGreaterThan(20);
    expect(declination * DEG).toBeLessThan(25);
  });
});

describe("isDaylit", () => {
  it("treats 9:26pm in Los Angeles as night", () => {
    const evening = new Date("2026-10-01T04:26:00.000Z");
    expect(isDaylit(34.05, -118.24, evening)).toBe(false);
  });

  it("treats the same moment in Singapore as morning", () => {
    const eveningInLa = new Date("2026-10-01T04:26:00.000Z");
    expect(isDaylit(1.35, 103.82, eveningInLa)).toBe(true);
  });
});
