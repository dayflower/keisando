import { describe, expect, it } from "vitest";
import type { StageDefinition } from "../../shared/types";
import { getNextPlayableStage, getNextStage } from "./stageProgression";

const buildStages = (): StageDefinition[] => [
  {
    id: "stage1",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 10_000,
      maxMistakes: -1,
    },
    createExpression: () => ({ left: 1, right: 1, operator: "+", answer: 2 }),
    createOptions: () => [
      { label: "2", isCorrect: true },
      { label: "1", isCorrect: false },
      { label: "3", isCorrect: false },
      { label: "4", isCorrect: false },
    ],
  },
  {
    id: "stage2",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 10_000,
      maxMistakes: -1,
    },
    createExpression: () => ({ left: 2, right: 1, operator: "+", answer: 3 }),
    createOptions: () => [
      { label: "3", isCorrect: true },
      { label: "2", isCorrect: false },
      { label: "4", isCorrect: false },
      { label: "5", isCorrect: false },
    ],
  },
  {
    id: "stage3",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 10_000,
      maxMistakes: -1,
    },
    createExpression: () => ({ left: 3, right: 1, operator: "+", answer: 4 }),
    createOptions: () => [
      { label: "4", isCorrect: true },
      { label: "3", isCorrect: false },
      { label: "5", isCorrect: false },
      { label: "6", isCorrect: false },
    ],
  },
];

describe("getNextStage", () => {
  it("returns the next stage when one exists", () => {
    expect(getNextStage("stage1", buildStages())?.id).toBe("stage2");
  });

  it("returns null for the final stage or unknown stage", () => {
    const stages = buildStages();

    expect(getNextStage("stage3", stages)).toBeNull();
    expect(getNextStage("missing", stages)).toBeNull();
  });
});

describe("getNextPlayableStage", () => {
  it("returns the next stage only when it is unlocked", () => {
    const stages = buildStages();

    expect(
      getNextPlayableStage("stage1", new Set(["stage1"]), stages),
    ).toBeNull();
    expect(
      getNextPlayableStage("stage1", new Set(["stage1", "stage2"]), stages)?.id,
    ).toBe("stage2");
  });

  it("returns null when no next stage exists", () => {
    expect(
      getNextPlayableStage(
        "stage3",
        new Set(["stage1", "stage2", "stage3"]),
        buildStages(),
      ),
    ).toBeNull();
  });
});
