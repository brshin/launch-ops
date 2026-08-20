import { describe, expect, it } from "vitest";
import type { Launch } from "../types/launch";
import { findQueueFocusIndex, pickDefaultApiId } from "./queueFocus";

const NOW = Date.parse("2026-08-19T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;

function launch(partial: {
  apiId: string;
  netOffsetMs: number;
  status: string;
}): Launch {
  return {
    apiId: partial.apiId,
    net: new Date(NOW + partial.netOffsetMs).toISOString(),
    status: { abbrev: partial.status },
  } as Launch;
}

describe("findQueueFocusIndex", () => {
  it("returns -1 for an empty queue", () => {
    expect(findQueueFocusIndex([], NOW)).toBe(-1);
  });

  it("prefers a live launch over a later upcoming one", () => {
    const launches = [
      launch({ apiId: "past", netOffsetMs: -HOUR, status: "Success" }),
      launch({ apiId: "live", netOffsetMs: 0, status: "In Flight" }),
      launch({ apiId: "next", netOffsetMs: HOUR, status: "Go" }),
    ];
    expect(findQueueFocusIndex(launches, NOW)).toBe(1);
  });

  it("selects the next non-failed upcoming launch when none are live", () => {
    const launches = [
      launch({ apiId: "elapsed", netOffsetMs: -HOUR, status: "Success" }),
      launch({ apiId: "failed-future", netOffsetMs: HOUR, status: "Failure" }),
      launch({ apiId: "next", netOffsetMs: 2 * HOUR, status: "Go" }),
    ];
    expect(findQueueFocusIndex(launches, NOW)).toBe(2);
  });

  it("can focus a TBD launch if it is the next NET", () => {
    const launches = [
      launch({ apiId: "elapsed", netOffsetMs: -HOUR, status: "Go" }),
      launch({ apiId: "tbd", netOffsetMs: HOUR, status: "TBD" }),
    ];
    expect(findQueueFocusIndex(launches, NOW)).toBe(1);
  });

  it("returns -1 when every launch is elapsed or failed", () => {
    const launches = [
      launch({ apiId: "done", netOffsetMs: -HOUR, status: "Success" }),
      launch({ apiId: "fail", netOffsetMs: HOUR, status: "Failure" }),
    ];
    expect(findQueueFocusIndex(launches, NOW)).toBe(-1);
  });
});

describe("pickDefaultApiId", () => {
  it("returns null for an empty queue", () => {
    expect(pickDefaultApiId([], NOW)).toBeNull();
  });

  it("returns the focused launch's apiId", () => {
    const launches = [
      launch({ apiId: "elapsed", netOffsetMs: -HOUR, status: "Success" }),
      launch({ apiId: "next", netOffsetMs: HOUR, status: "Go" }),
    ];
    expect(pickDefaultApiId(launches, NOW)).toBe("next");
  });

  it("falls back to the first launch when nothing is live or upcoming", () => {
    const launches = [
      launch({ apiId: "first", netOffsetMs: -2 * HOUR, status: "Success" }),
      launch({ apiId: "second", netOffsetMs: -HOUR, status: "Success" }),
    ];
    expect(pickDefaultApiId(launches, NOW)).toBe("first");
  });
});
