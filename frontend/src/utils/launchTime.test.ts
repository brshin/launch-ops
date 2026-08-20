import { describe, expect, it } from "vitest";
import { getLaunchTime, isNetPreciseEnough } from "./launchTime";

const NOW = Date.parse("2026-08-19T12:00:00.000Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function netFromNow(offsetMs: number): string {
  return new Date(NOW + offsetMs).toISOString();
}

describe("isNetPreciseEnough", () => {
  it("treats missing precision as precise enough", () => {
    expect(isNetPreciseEnough()).toBe(true);
    expect(isNetPreciseEnough(null)).toBe(true);
    expect(isNetPreciseEnough({})).toBe(true);
  });

  it("rejects day-or-coarser tokens from abbrev or name", () => {
    expect(isNetPreciseEnough({ abbrev: "DAY" })).toBe(false);
    expect(isNetPreciseEnough({ name: "Week" })).toBe(false);
    expect(isNetPreciseEnough({ abbrev: "MON" })).toBe(false);
    expect(isNetPreciseEnough({ abbrev: "hour" })).toBe(true);
    expect(isNetPreciseEnough({ abbrev: "MIN" })).toBe(true);
  });
});

describe("getLaunchTime", () => {
  it("maps status to a phase and chip before using the clock", () => {
    const net = netFromNow(21 * MINUTE);
    const cases = [
      { status: "In Flight", phase: "live", chip: "LIVE" },
      { status: "Hold", phase: "hold", chip: "HOLD" },
      { status: "TBD", phase: "provisional", chip: "NET TBD" },
      { status: "TBC", phase: "provisional", chip: "NET TBD" },
      { status: "Failure", phase: "failed", chip: "FAIL" },
      { status: "Partial Failure", phase: "failed", chip: "FAIL" },
    ] as const;

    for (const { status, phase, chip } of cases) {
      expect(
        getLaunchTime({ net, status, now: NOW }),
      ).toMatchObject({ phase, chip });
    }
  });

  it("does not imply a relative ETA for TBD/TBC even when NET is soon", () => {
    const result = getLaunchTime({
      net: netFromNow(21 * MINUTE),
      status: "TBD",
      now: NOW,
    });
    expect(result.preciseEnough).toBe(false);
    expect(result.chip).toBe("NET TBD");
  });

  it("uses Success as elapsed even if NET is still in the future", () => {
    const result = getLaunchTime({
      net: netFromNow(HOUR),
      status: "Success",
      now: NOW,
    });
    expect(result.phase).toBe("elapsed");
    expect(result.chip).toBe("T− 1 hr");
  });

  it("counts down when NET is in the future", () => {
    const result = getLaunchTime({
      net: netFromNow(21 * MINUTE),
      status: "Go",
      now: NOW,
    });
    expect(result).toMatchObject({
      phase: "countdown",
      chip: "T− 21 min",
      preciseEnough: true,
      msUntilNet: 21 * MINUTE,
    });
  });

  it("marks elapsed after NET and switches the chip to T+", () => {
    const result = getLaunchTime({
      net: netFromNow(-30_000),
      status: "Go",
      now: NOW,
    });
    expect(result).toMatchObject({
      phase: "elapsed",
      chip: "T+ 30s",
      msUntilNet: -30_000,
    });
  });

  it("omits the relative chip when NET precision is coarser than an hour", () => {
    const result = getLaunchTime({
      net: netFromNow(21 * MINUTE),
      status: "Go",
      netPrecision: { abbrev: "DAY" },
      now: NOW,
    });
    expect(result).toMatchObject({
      phase: "countdown",
      chip: "",
      preciseEnough: false,
    });
  });

  it("buckets relative chips at second / minute / hour / day boundaries", () => {
    const cases = [
      { offset: 30_000, chip: "T− 30s" },
      { offset: MINUTE - 1, chip: "T− 59s" },
      { offset: MINUTE, chip: "T− 1 min" },
      { offset: HOUR - 1, chip: "T− 59 min" },
      { offset: HOUR, chip: "T− 1 hr" },
      { offset: 3 * HOUR, chip: "T− 3 hr" },
      { offset: DAY - 1, chip: "T− 23 hr" },
      { offset: DAY, chip: "T− 1d" },
      { offset: 2 * DAY, chip: "T− 2d" },
      { offset: -2 * DAY, chip: "T+ 2d" },
    ];

    for (const { offset, chip } of cases) {
      expect(
        getLaunchTime({
          net: netFromNow(offset),
          status: "Go",
          now: NOW,
        }).chip,
      ).toBe(chip);
    }
  });
});
