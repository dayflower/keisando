import { describe, expect, it } from "vitest";
import type { StageDefinition } from "../../shared/types";
import { createOptions, createQuestion } from "./logic";

describe("createOptions", () => {
  it("returns 4 unique options including answer within range", () => {
    const options = createOptions(5, 1, 20);

    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain(5);
    expect(options.every((value) => value >= 1 && value <= 20)).toBe(true);
  });
});

describe("createQuestion", () => {
  it("supports structured option labels and custom prompts", () => {
    const stage: StageDefinition = {
      id: "stage5",
      baseQuestionCount: 10,
      answerMin: 0,
      answerMax: 9,
      defaultClearCondition: {
        maxElapsedMs: 15_000,
        requireNoMistake: true,
      },
      createExpression: () => ({
        left: 56,
        right: 8,
        operator: "×",
        answer: 7,
      }),
      formatQuestion: (expression) =>
        `${expression.left} = ${expression.right} × ?`,
      formatOptionLabel: (value, expression) =>
        `${expression.right} × ${value}`,
    };

    const question = createQuestion(stage, new Set());

    expect(question.prompt).toBe("56 = 8 × ?");
    expect(question.options).toHaveLength(4);
    expect(question.options.filter((option) => option.isCorrect)).toHaveLength(
      1,
    );
    expect(
      question.options.every((option) => option.label.includes("8 ×")),
    ).toBe(true);
  });
});
