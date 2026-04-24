import { describe, expect, it } from "vitest";
import type { StageDefinition } from "../../shared/types";
import { createQuestion } from "./logic";

describe("createQuestion", () => {
  it("supports structured option labels and custom prompts", () => {
    const stage: StageDefinition = {
      id: "stage5",
      baseQuestionCount: 10,
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
      createOptions: (expression) => [
        { label: `${expression.right} × 6`, isCorrect: false },
        { label: `${expression.right} × 7`, isCorrect: true },
        { label: `${expression.right} × 8`, isCorrect: false },
        { label: `${expression.right} × 9`, isCorrect: false },
      ],
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
      createOptions: (expression) => [
        { label: `7 (${expression.right * 7})`, isCorrect: false },
        { label: `8 (${expression.right * 8})`, isCorrect: true },
        { label: `9 (${expression.right * 9})`, isCorrect: false },
        { label: `6 (${expression.right * 6})`, isCorrect: false },
      ],
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
