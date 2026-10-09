import { describe, expect, it } from "vitest";
import {
  HOUR_CYCLE_STORAGE_KEY,
  parseHourCycle,
  readHourCycle,
  writeHourCycle,
} from "./hourCycle";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(HOUR_CYCLE_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("parseHourCycle", () => {
  it("keeps 12-hour unless the stored value is 24", () => {
    expect(parseHourCycle(null)).toBe("12");
    expect(parseHourCycle(undefined)).toBe("12");
    expect(parseHourCycle("12")).toBe("12");
    expect(parseHourCycle("nope")).toBe("12");
    expect(parseHourCycle("24")).toBe("24");
  });
});

describe("readHourCycle / writeHourCycle", () => {
  it("remembers 12-hour on the provided storage", () => {
    const storage = memoryStorage();
    expect(readHourCycle(storage)).toBe("12");
    writeHourCycle("24", storage);
    expect(readHourCycle(storage)).toBe("24");
    writeHourCycle("12", storage);
    expect(readHourCycle(storage)).toBe("12");
  });

  it("falls back to 12-hour when storage throws", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readHourCycle(storage)).toBe("12");
    expect(() => writeHourCycle("12", storage)).not.toThrow();
  });
});
