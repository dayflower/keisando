import { describe, expect, it } from "vitest";
import { createTextOnlyQuestionOption } from "../../shared/questionOptions";
import type { StageDefinition } from "../../shared/types";
import { unlockAllStagesForPlayer } from "./logic";

const createStage = (id: string): StageDefinition => ({
  id,
  baseQuestionCount: 10,
  defaultClearCondition: {
    maxElapsedMs: 15_000,
    maxMistakes: 0,
  },
  createExpression: () => ({
    left: 1,
    right: 1,
    operator: "+",
    answer: 2,
  }),
  createOptions: () => [
    createTextOnlyQuestionOption("2", true),
    createTextOnlyQuestionOption("1", false),
    createTextOnlyQuestionOption("3", false),
    createTextOnlyQuestionOption("4", false),
  ],
});

describe("unlockAllStagesForPlayer", () => {
  it("replaces the target player unlock progress with every unlockable stage", () => {
    const result = unlockAllStagesForPlayer(
      {
        player1: ["stage2"],
        player2: ["stage2", "stage3"],
      },
      "player1",
      [createStage("stage1"), createStage("stage2"), createStage("stage3")],
    );

    expect(result).toEqual({
      player1: ["stage2", "stage3"],
      player2: ["stage2", "stage3"],
    });
  });

  it("keeps the first stage implicit when there is only one stage", () => {
    const result = unlockAllStagesForPlayer({}, "player1", [
      createStage("stage1"),
    ]);

    expect(result).toEqual({
      player1: [],
    });
  });
});
