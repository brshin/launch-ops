import { describe, expect, it } from "vitest";
import { stepQueueIndex } from "./queueNav";

describe("stepQueueIndex", () => {
  it("steps within bounds", () => {
    expect(stepQueueIndex(2, 5, 1)).toBe(3);
    expect(stepQueueIndex(2, 5, -1)).toBe(1);
  });

  it("clamps at the ends without wrapping", () => {
    expect(stepQueueIndex(0, 5, -1)).toBe(0);
    expect(stepQueueIndex(4, 5, 1)).toBe(4);
  });

  it("handles an empty queue", () => {
    expect(stepQueueIndex(0, 0, 1)).toBe(0);
  });
});
