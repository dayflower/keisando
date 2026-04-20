import { describe, expect, it } from "vitest";
import { calculateScore, createOptions } from "./logic";

describe("calculateScore", () => {
  it("calculates a score from elapsed time", () => {
    expect(calculateScore(2000, 0)).toBe(500);
  });

  it("penalizes wrong answers", () => {
    expect(calculateScore(2000, 1)).toBeLessThan(calculateScore(2000, 0));
  });

  it("protects denominator lower bound", () => {
    expect(calculateScore(-100, 0)).toBe(1_000_000);
  });
});

describe("createOptions", () => {
  it("returns 4 unique options including answer within range", () => {
    const options = createOptions(5, 1, 20);

    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain(5);
    expect(options.every((value) => value >= 1 && value <= 20)).toBe(true);
  });
});
