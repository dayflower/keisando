import { describe, expect, it } from "vitest";
import { createTextOnlyQuestionOption } from "../../shared/questionOptions";
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
      createTextOnlyQuestionOption("2", true),
      createTextOnlyQuestionOption("1", false),
      createTextOnlyQuestionOption("3", false),
      createTextOnlyQuestionOption("4", false),
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
      createTextOnlyQuestionOption("3", true),
      createTextOnlyQuestionOption("2", false),
      createTextOnlyQuestionOption("4", false),
      createTextOnlyQuestionOption("5", false),
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
      createTextOnlyQuestionOption("4", true),
      createTextOnlyQuestionOption("3", false),
      createTextOnlyQuestionOption("5", false),
      createTextOnlyQuestionOption("6", false),
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
