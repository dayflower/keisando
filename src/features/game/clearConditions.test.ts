import { describe, expect, it } from "vitest";
import {
  isStageConditionClear,
  normalizeClearCondition,
} from "./clearConditions";

describe("normalizeClearCondition", () => {
  it("falls back invalid values and clamps time", () => {
    expect(
      normalizeClearCondition(
        { maxElapsedMs: 40, requireNoMistake: true },
        { maxElapsedMs: 15_000, requireNoMistake: false },
      ),
    ).toEqual({
      maxElapsedMs: 100,
      requireNoMistake: true,
    });

    expect(
      normalizeClearCondition(
        { maxElapsedMs: Number.NaN },
        { maxElapsedMs: 15_000, requireNoMistake: false },
      ),
    ).toEqual({
      maxElapsedMs: 15_000,
      requireNoMistake: false,
    });
  });
});

describe("isStageConditionClear", () => {
  it("checks time and no-mistake flags", () => {
    expect(
      isStageConditionClear(14_900, 0, {
        maxElapsedMs: 15_000,
        requireNoMistake: true,
      }),
    ).toBe(true);

    expect(
      isStageConditionClear(15_100, 0, {
        maxElapsedMs: 15_000,
        requireNoMistake: true,
      }),
    ).toBe(false);

    expect(
      isStageConditionClear(14_000, 1, {
        maxElapsedMs: 15_000,
        requireNoMistake: true,
      }),
    ).toBe(false);

    expect(
      isStageConditionClear(14_000, 1, {
        maxElapsedMs: 15_000,
        requireNoMistake: false,
      }),
    ).toBe(true);
  });
});
