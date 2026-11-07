import { describe, expect, it } from "vitest";
import {
  formatUpdateAge,
  mergeConsoleUpdates,
  normalizeConsoleUpdate,
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
    detail: "Added to the board",
    ...overrides,
  };
}

describe("normalizeConsoleUpdate", () => {
  it("accepts valid rows and rejects junk", () => {
    expect(
      normalizeConsoleUpdate(
        update({ id: "1", kind: "webcast", detail: "Webcast just went live" }),
      ),
    ).toMatchObject({ id: "1", kind: "webcast" });
    expect(normalizeConsoleUpdate({ id: "x" })).toBeNull();
  });
});

describe("mergeConsoleUpdates", () => {
  it("prepends incoming and drops duplicate ids", () => {
    const merged = mergeConsoleUpdates(
      [update({ id: "new" }), update({ id: "dup" })],
      [update({ id: "dup" }), update({ id: "old" })],
      24,
    );
    expect(merged.map((row) => row.id)).toEqual(["new", "dup", "old"]);
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
    expect(updateKindLabel("rescheduled")).toBe("NET");
  });
});
