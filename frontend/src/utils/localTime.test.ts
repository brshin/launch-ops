import { describe, expect, it } from "vitest";
import { getLocalZoneName } from "./localTime";

const SUMMER = new Date("2026-07-01T19:00:00.000Z");
const WINTER = new Date("2026-01-15T19:00:00.000Z");

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
