import { describe, expect, it } from "vitest";
import type { StageDefinition } from "../../shared/types";
import {
  applyStageQuestionCountOverride,
  normalizeStageQuestionCount,
} from "./stageQuestionCounts";

const stage: StageDefinition = {
  id: "stage1",
  baseQuestionCount: 10,
  defaultClearCondition: {
    maxElapsedMs: 10_000,
    maxMistakes: 0,
  },
  createExpression: () => ({
    left: 1,
    right: 2,
    operator: "+",
    answer: 3,
  }),
  createOptions: () => [
    { label: "3", isCorrect: true },
    { label: "2", isCorrect: false },
    { label: "4", isCorrect: false },
    { label: "5", isCorrect: false },
  ],
};

describe("stageQuestionCounts", () => {
  it("rounds and clamps overridden question counts", () => {
    expect(normalizeStageQuestionCount(12.6, stage.baseQuestionCount)).toBe(13);
    expect(normalizeStageQuestionCount(0, stage.baseQuestionCount)).toBe(1);
    expect(normalizeStageQuestionCount(null, stage.baseQuestionCount)).toBe(10);
  });

  it("returns a stage definition with an overridden question count", () => {
    expect(applyStageQuestionCountOverride(stage, 14).baseQuestionCount).toBe(
      14,
    );
    expect(stage.baseQuestionCount).toBe(10);
  });
});
