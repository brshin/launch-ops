import { describe, expect, it } from "vitest";
import { formatLocalDateTime, formatLocalTime, getLocalZoneName } from "./localTime";

const SUMMER = new Date("2026-07-01T19:00:00.000Z");
const WINTER = new Date("2026-01-15T19:00:00.000Z");

describe("formatLocalTime", () => {
  const afternoon = new Date("2026-06-15T20:05:09.000Z");

  it("defaults to 24-hour time with no meridian", () => {
    const value = formatLocalTime(afternoon);
    expect(value).not.toMatch(/AM|PM/);
  });

  it("uses a 1–12 clock with a meridian when asked", () => {
    const value = formatLocalTime(afternoon, { hour12: true, includeSeconds: true });
    expect(value).toMatch(/^\d{1,2}:\d{2}:\d{2} [AP]M$/);
    expect(value).not.toContain("\u202f");
  });

  it("carries the meridian into the date label", () => {
    const label = formatLocalDateTime(afternoon, { includeYear: false, hour12: true }).label;
    expect(label).toMatch(/ [AP]M$/);
    expect(formatLocalDateTime(afternoon, { includeYear: false }).label).not.toMatch(/AM|PM/);
  });
});

describe("getLocalZoneName", () => {
  it("uses the shared region, not the reference city", () => {
    expect(getLocalZoneName(SUMMER, "America/Los_Angeles")).toBe("Pacific");
    expect(getLocalZoneName(WINTER, "America/Los_Angeles")).toBe("Pacific");
    expect(getLocalZoneName(SUMMER, "America/New_York")).toBe("Eastern");
    expect(getLocalZoneName(SUMMER, "America/Chicago")).toBe("Central");
    expect(getLocalZoneName(SUMMER, "America/Denver")).toBe("Mountain");
    expect(getLocalZoneName(SUMMER, "America/Phoenix")).toBe("Mountain");
  });

  it("keeps a place name when the zone is that place", () => {
    expect(getLocalZoneName(SUMMER, "Asia/Singapore")).toBe("Singapore");
    expect(getLocalZoneName(SUMMER, "Asia/Tokyo")).toBe("Japan");
    expect(getLocalZoneName(SUMMER, "Asia/Kolkata")).toBe("India");
    expect(getLocalZoneName(SUMMER, "Europe/London")).toBe("United Kingdom");
    expect(getLocalZoneName(SUMMER, "Pacific/Auckland")).toBe("New Zealand");
  });
});
