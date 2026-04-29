import { describe, expect, it } from "vitest";
import {
  createTextOnlyQuestionOption,
  getQuestionOptionText,
} from "../../shared/questionOptions";
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
      createOptions: (expression) => [
        createTextOnlyQuestionOption(`${expression.right} × 6`, false),
        createTextOnlyQuestionOption(`${expression.right} × 7`, true),
        createTextOnlyQuestionOption(`${expression.right} × 8`, false),
        createTextOnlyQuestionOption(`${expression.right} × 9`, false),
      ],
    };

    const question = createQuestion(stage, new Set());

    expect(question.prompt).toBe("56 = 8 × ?");
    expect(question.options).toHaveLength(4);
    expect(question.options.filter((option) => option.isCorrect)).toHaveLength(
      1,
    );
    expect(
      question.options.every((option) =>
        getQuestionOptionText(option).includes("8 ×"),
      ),
    ).toBe(true);
  });

  it("supports remainder-aware multiplication fill-in labels", () => {
    const stage: StageDefinition = {
      id: "stage8",
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
      createOptions: (expression) => [
        createTextOnlyQuestionOption(`7 (${expression.right * 7})`, false),
        createTextOnlyQuestionOption(`8 (${expression.right * 8})`, true),
        createTextOnlyQuestionOption(`9 (${expression.right * 9})`, false),
        createTextOnlyQuestionOption(`6 (${expression.right * 6})`, false),
      ],
    };

    const question = createQuestion(stage, new Set());

    expect(question.prompt).toBe("58 = 7 × ? + 2");
    expect(
      question.options.some(
        (option) => getQuestionOptionText(option) === "8 (56)",
      ),
    ).toBe(true);
  });

  it("supports remainder-aware division option labels", () => {
    const stage: StageDefinition = {
      id: "stage9",
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
        createTextOnlyQuestionOption(locale === "ja" ? "8 … 1" : "8 R 1", true),
        createTextOnlyQuestionOption(
          locale === "ja" ? "7 … 2" : "7 R 2",
          false,
        ),
        createTextOnlyQuestionOption(
          locale === "ja" ? "6 … 3" : "6 R 3",
          false,
        ),
        createTextOnlyQuestionOption(
          locale === "ja" ? "5 … 4" : "5 R 4",
          false,
        ),
      ],
    };

    const question = createQuestion(stage, new Set(), "en");

    expect(question.prompt).toBe("73 ÷ 9 = ?");
    expect(
      question.options.some(
        (option) => getQuestionOptionText(option) === "8 R 1",
      ),
    ).toBe(true);
  });

  it("supports locale-specific remainder division option labels", () => {
    const stage: StageDefinition = {
      id: "stage9",
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
        createTextOnlyQuestionOption(locale === "ja" ? "8 … 1" : "8 R 1", true),
        createTextOnlyQuestionOption(
          locale === "ja" ? "7 … 2" : "7 R 2",
          false,
        ),
        createTextOnlyQuestionOption(
          locale === "ja" ? "6 … 3" : "6 R 3",
          false,
        ),
        createTextOnlyQuestionOption(
          locale === "ja" ? "5 … 4" : "5 R 4",
          false,
        ),
      ],
    };

    const question = createQuestion(stage, new Set(), "ja");

    expect(
      question.options.some(
        (option) => getQuestionOptionText(option) === "8 … 1",
      ),
    ).toBe(true);
  });

  it("supports localized binary comparison prompts and two options", () => {
    const stage: StageDefinition = {
      id: "stage7",
      baseQuestionCount: 10,
      defaultClearCondition: {
        maxElapsedMs: 60_000,
        maxMistakes: 0,
      },
      createExpression: () => ({
        left: 42,
        right: 35,
        operator: "×",
        answer: 0,
        leftLabel: "6 × 7",
        rightLabel: "5 × 7",
      }),
      formatQuestion: (_expression, locale) =>
        locale === "ja" ? "どっちが大きい?" : "Which is greater?",
      createOptions: (expression) => [
        createTextOnlyQuestionOption(expression.leftLabel ?? "", true),
        createTextOnlyQuestionOption(expression.rightLabel ?? "", false),
      ],
    };

    const question = createQuestion(stage, new Set(), "ja");

    expect(question.prompt).toBe("どっちが大きい?");
    expect(question.options).toHaveLength(2);
    expect(
      question.options.map((option) => getQuestionOptionText(option)),
    ).toEqual(["6 × 7", "5 × 7"]);
  });
});
