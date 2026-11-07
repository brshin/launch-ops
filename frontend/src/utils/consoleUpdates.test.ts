import { describe, expect, it } from "vitest";
import {
  formatUpdateAge,
  mergeConsoleUpdates,
  normalizeConsoleUpdate,
  sortConsoleUpdates,
  updateKindLabel,
  type ConsoleUpdate,
} from "./consoleUpdates";

const NOW = Date.parse("2026-08-19T12:00:00.000Z");

function update(
  overrides: Partial<ConsoleUpdate> & Pick<ConsoleUpdate, "id">,
): ConsoleUpdate {
  return {
    kind: "scheduled",
    atMs: NOW,
    apiId: "a",
    title: "Mission",
    detail: "Added to the queue",
    ...overrides,
  };
}

describe("normalizeConsoleUpdate", () => {
  it("accepts valid rows and rejects junk", () => {
    expect(
      normalizeConsoleUpdate(
        update({ id: "1", kind: "webcast", detail: "Webcast is live now" }),
      ),
    ).toMatchObject({ id: "1", kind: "webcast" });
    expect(normalizeConsoleUpdate({ id: "x" })).toBeNull();
  });
});

describe("sortConsoleUpdates", () => {
  it("orders by atMs newest-first, then kind priority", () => {
    const sorted = sortConsoleUpdates([
      update({ id: "old-new", kind: "scheduled", atMs: NOW - 60_000 }),
      update({ id: "new-status", kind: "status", atMs: NOW }),
      update({ id: "new-live", kind: "webcast", atMs: NOW }),
      update({ id: "mid", kind: "rescheduled", atMs: NOW - 30_000 }),
    ]);
    expect(sorted.map((row) => row.id)).toEqual([
      "new-live",
      "new-status",
      "mid",
      "old-new",
    ]);
  });
});

describe("mergeConsoleUpdates", () => {
  it("dedupes, sorts newest-first, and caps length", () => {
    const merged = mergeConsoleUpdates(
      [
        update({ id: "newer", atMs: NOW + 10_000 }),
        update({ id: "dup", atMs: NOW + 5_000 }),
      ],
      [
        update({ id: "dup", atMs: NOW - 1 }),
        update({ id: "older", atMs: NOW - 60_000 }),
      ],
      24,
    );
    expect(merged.map((row) => row.id)).toEqual(["newer", "dup", "older"]);
    expect(merged[1]?.atMs).toBe(NOW + 5_000);
  });
});

describe("formatUpdateAge", () => {
  it("formats short ages", () => {
    expect(formatUpdateAge(NOW, NOW + 1000)).toBe("Just now");
    expect(formatUpdateAge(NOW, NOW + 30_000)).toBe("30s ago");
    expect(formatUpdateAge(NOW, NOW + 5 * 60_000)).toBe("5m ago");
  });
});

describe("updateKindLabel", () => {
  it("maps kinds to short chips", () => {
    expect(updateKindLabel("webcast")).toBe("Live");
    expect(updateKindLabel("scheduled")).toBe("New");
    expect(updateKindLabel("rescheduled")).toBe("Time");
    expect(updateKindLabel("removed")).toBe("Gone");
  });
});
