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
        maxMistakes: 0,
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

  it("supports remainder-aware multiplication fill-in labels", () => {
    const stage: StageDefinition = {
      id: "stage7",
      baseQuestionCount: 10,
      answerMin: 0,
      answerMax: 9,
      defaultClearCondition: {
        maxElapsedMs: 15_000,
        maxMistakes: 0,
      },
      createExpression: () => ({
        left: 58,
        right: 7,
        operator: "×",
        answer: 8,
        remainder: 2,
      }),
      formatQuestion: (expression) =>
        `${expression.left} = ${expression.right} × ? + ${expression.remainder ?? 0}`,
      formatOptionLabel: (value, expression) =>
        `${value} (${expression.right * value})`,
    };

    const question = createQuestion(stage, new Set());

    expect(question.prompt).toBe("58 = 7 × ? + 2");
    expect(question.options.some((option) => option.label === "8 (56)")).toBe(
      true,
    );
  });

  it("supports remainder-aware division option labels", () => {
    const stage: StageDefinition = {
      id: "stage8",
      baseQuestionCount: 10,
      answerMin: 0,
      answerMax: 9,
      defaultClearCondition: {
        maxElapsedMs: 15_000,
        maxMistakes: 0,
      },
      createExpression: () => ({
        left: 73,
        right: 9,
        operator: "÷",
        answer: 8,
        remainder: 1,
      }),
      createOptions: (_expression, locale) => [
        {
          label: locale === "ja" ? "8 … 1" : "8 R 1",
          isCorrect: true,
        },
        {
          label: locale === "ja" ? "7 … 2" : "7 R 2",
          isCorrect: false,
        },
        {
          label: locale === "ja" ? "6 … 3" : "6 R 3",
          isCorrect: false,
        },
        {
          label: locale === "ja" ? "5 … 4" : "5 R 4",
          isCorrect: false,
        },
      ],
    };

    const question = createQuestion(stage, new Set(), "en");

    expect(question.prompt).toBe("73 ÷ 9 = ?");
    expect(question.options.some((option) => option.label === "8 R 1")).toBe(
      true,
    );
  });

  it("supports locale-specific remainder division option labels", () => {
    const stage: StageDefinition = {
      id: "stage8",
      baseQuestionCount: 10,
      answerMin: 0,
      answerMax: 9,
      defaultClearCondition: {
        maxElapsedMs: 15_000,
        maxMistakes: 0,
      },
      createExpression: () => ({
        left: 73,
        right: 9,
        operator: "÷",
        answer: 8,
        remainder: 1,
      }),
      createOptions: (_expression, locale) => [
        {
          label: locale === "ja" ? "8 … 1" : "8 R 1",
          isCorrect: true,
        },
        {
          label: locale === "ja" ? "7 … 2" : "7 R 2",
          isCorrect: false,
        },
        {
          label: locale === "ja" ? "6 … 3" : "6 R 3",
          isCorrect: false,
        },
        {
          label: locale === "ja" ? "5 … 4" : "5 R 4",
          isCorrect: false,
        },
      ],
    };

    const question = createQuestion(stage, new Set(), "ja");

    expect(question.options.some((option) => option.label === "8 … 1")).toBe(
      true,
    );
  });
});
