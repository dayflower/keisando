import { describe, expect, it } from "vitest";
import {
  isStageConditionClear,
  normalizeClearCondition,
} from "./clearConditions";

describe("normalizeClearCondition", () => {
  it("falls back invalid values and clamps time", () => {
    expect(
      normalizeClearCondition(
        { maxElapsedMs: 40, maxMistakes: -3 },
        { maxElapsedMs: 15_000, maxMistakes: 2 },
      ),
    ).toEqual({
      maxElapsedMs: 100,
      maxMistakes: -3,
    });

    expect(
      normalizeClearCondition(
        { maxElapsedMs: Number.NaN },
        { maxElapsedMs: 15_000, maxMistakes: 2 },
      ),
    ).toEqual({
      maxElapsedMs: 15_000,
      maxMistakes: 2,
    });
  });
});

describe("isStageConditionClear", () => {
  it("checks time and max-mistake thresholds", () => {
    expect(
      isStageConditionClear(14_900, 0, {
        maxElapsedMs: 15_000,
        maxMistakes: 0,
      }),
    ).toBe(true);

    expect(
      isStageConditionClear(15_100, 0, {
        maxElapsedMs: 15_000,
        maxMistakes: 0,
      }),
    ).toBe(false);

    expect(
      isStageConditionClear(14_000, 1, {
        maxElapsedMs: 15_000,
        maxMistakes: 0,
      }),
    ).toBe(false);

    expect(
      isStageConditionClear(14_000, 1, {
        maxElapsedMs: 15_000,
        maxMistakes: 3,
      }),
    ).toBe(true);

    expect(
      isStageConditionClear(14_000, 99, {
        maxElapsedMs: 15_000,
        maxMistakes: -5,
      }),
    ).toBe(true);
  });
});
