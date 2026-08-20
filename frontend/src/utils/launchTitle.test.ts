import { describe, expect, it } from "vitest";
import type { Launch } from "../types/launch";
import { getLaunchTitle, getRocketName } from "./launchTitle";

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
