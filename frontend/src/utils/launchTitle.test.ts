import { describe, expect, it } from "vitest";
import type { Launch } from "../types/launch";
import {
  agencyMarkUrl,
  getLaunchTitle,
  getMissionBrief,
  getMissionCustomers,
  getMissionOrbitLabel,
  getMissionTypeLabel,
  getRocketName,
  MISSING_MISSION_BRIEF,
} from "./launchTitle";

function launch(overrides: {
  name?: string;
  missionName?: string | null;
  rocketFullName?: string | null;
  rocketName?: string | null;
}): Launch {
  return {
    name: overrides.name ?? "Starlink Group 6-1",
    mission:
      overrides.missionName === null
        ? undefined
        : { name: overrides.missionName ?? "Starlink" },
    rocket: {
      configuration: {
        full_name: overrides.rocketFullName ?? undefined,
        name: overrides.rocketName ?? undefined,
      },
    },
  } as Launch;
}

describe("getRocketName", () => {
  it("prefers configuration full_name over name", () => {
    expect(
      getRocketName(
        launch({ rocketFullName: "Falcon 9", rocketName: "F9" }),
      ),
    ).toBe("Falcon 9");
  });

  it("falls back to configuration name, then null", () => {
    expect(getRocketName(launch({ rocketName: "Falcon 9" }))).toBe("Falcon 9");
    expect(getRocketName(launch({}))).toBeNull();
  });
});

describe("getLaunchTitle", () => {
  it("uses the mission name when it is real", () => {
    expect(getLaunchTitle(launch({ missionName: "NROL-77" }))).toBe("NROL-77");
  });

  it("skips unknown or blank mission names and uses the rocket", () => {
    expect(
      getLaunchTitle(
        launch({
          missionName: "Unknown Payload",
          rocketFullName: "Falcon 9",
        }),
      ),
    ).toBe("Falcon 9");
    expect(
      getLaunchTitle(launch({ missionName: "  ", rocketName: "Electron" })),
    ).toBe("Electron");
    expect(getLaunchTitle(launch({ missionName: null, rocketName: "H3" }))).toBe(
      "H3",
    );
  });

  it("falls back to launch.name when mission and rocket are unusable", () => {
    expect(
      getLaunchTitle(
        launch({ name: "Starlink Group 6-1", missionName: "unknown payload" }),
      ),
    ).toBe("Starlink Group 6-1");
  });
});

describe("getMissionBrief", () => {
  it("replaces feed placeholders with one caption", () => {
    expect(getMissionBrief("Details TBD.")).toBe(MISSING_MISSION_BRIEF);
    expect(getMissionBrief("TBD")).toBe(MISSING_MISSION_BRIEF);
    expect(getMissionBrief("  ")).toBe(MISSING_MISSION_BRIEF);
    expect(getMissionBrief(null)).toBe(MISSING_MISSION_BRIEF);
  });

  it("keeps a real description", () => {
    const text = "A batch of satellites for the Starlink constellation.";
    expect(getMissionBrief(text)).toBe(text);
  });
});

describe("getMissionTypeLabel", () => {
  it("keeps a readable category and shortens the classified slash name", () => {
    expect(getMissionTypeLabel("Communications")).toBe("Communications");
    expect(getMissionTypeLabel("Government/Top Secret")).toBe("Classified");
    expect(getMissionTypeLabel("N/A")).toBeNull();
    expect(getMissionTypeLabel("Unknown")).toBeNull();
  });
});

describe("getMissionOrbitLabel", () => {
  it("uses a short plain name instead of the abbreviation", () => {
    expect(getMissionOrbitLabel({ name: "Low Earth Orbit", abbrev: "LEO" })).toBe("Low Earth");
    expect(getMissionOrbitLabel({ name: "Polar Orbit", abbrev: "PO" })).toBe("Polar");
    expect(getMissionOrbitLabel({ name: "Mars Orbit", abbrev: "Mars" })).toBe("Mars");
    expect(getMissionOrbitLabel({ name: "Geostationary Transfer Orbit", abbrev: "GTO" })).toBe(
      "GEO Transfer",
    );
  });

  it("hides an unknown orbit", () => {
    expect(getMissionOrbitLabel({ name: "Unknown", abbrev: "N/A" })).toBeNull();
    expect(getMissionOrbitLabel(null)).toBeNull();
  });
});

describe("getMissionCustomers", () => {
  it("drops the launch provider and keeps the other agencies", () => {
    const crew = {
      launch_service_provider: { name: "SpaceX", abbrev: "SpX" },
      mission: {
        agencies: [
          { abbrev: "CSA", name: "Canadian Space Agency" },
          { abbrev: "NASA", name: "National Aeronautics and Space Administration" },
          { abbrev: "SpX", name: "SpaceX" },
          { abbrev: "RFSA", name: "Russian Federal Space Agency (ROSCOSMOS)" },
        ],
      },
    } as Launch;

    expect(getMissionCustomers(crew)).toEqual([
      { label: "CSA", markUrl: null },
      { label: "NASA", markUrl: null },
      { label: "RFSA", markUrl: null },
    ]);
  });

  it("returns nothing when the only agency is the provider, or the list is empty", () => {
    const starlink = {
      launch_service_provider: { name: "SpaceX", abbrev: "SpX" },
      mission: { agencies: [{ abbrev: "SpX", name: "SpaceX" }] },
    } as Launch;
    const empty = {
      launch_service_provider: { name: "KARI", abbrev: "KARI" },
      mission: { agencies: [] },
    } as Launch;

    expect(getMissionCustomers(starlink)).toEqual([]);
    expect(getMissionCustomers(empty)).toEqual([]);
  });

  it("keeps a customer mark, preferring the social thumbnail", () => {
    const crs = {
      launch_service_provider: { name: "SpaceX", abbrev: "SpX" },
      mission: {
        agencies: [
          {
            abbrev: "NASA",
            name: "National Aeronautics and Space Administration",
            social_logo: { thumbnail_url: "https://cdn.example/nasa-social.jpg", image_url: "https://cdn.example/nasa-social-full.jpg" },
            logo: { thumbnail_url: "https://cdn.example/nasa-logo.png" },
          },
        ],
      },
    } as Launch;

    expect(getMissionCustomers(crs)).toEqual([
      { label: "NASA", markUrl: "https://cdn.example/nasa-social.jpg" },
    ]);
  });
});

describe("agencyMarkUrl", () => {
  it("falls back to the wordmark when there is no social mark", () => {
    expect(
      agencyMarkUrl({
        logo: { thumbnail_url: "https://cdn.example/sda.jpg", image_url: "https://cdn.example/sda-full.jpg" },
      }),
    ).toBe("https://cdn.example/sda.jpg");
  });

  it("returns null when neither mark has a url", () => {
    expect(agencyMarkUrl(null)).toBeNull();
    expect(agencyMarkUrl({ social_logo: { thumbnail_url: "  " }, logo: null })).toBeNull();
  });
});
