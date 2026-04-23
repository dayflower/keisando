import type { StageDefinition } from "./types";

const STAGE1_ZERO_RETRY_RATE = 0.7;
const STAGE2_ZERO_RETRY_RATE = 0.7;
const STAGE3_ZERO_RETRY_RATE = 0.8;
const MAX_ZERO_RETRIES = 3;

const retryZeroWeightedExpression = <T>(
  createExpression: () => T,
  includesZero: (expression: T) => boolean,
  retryRate: number,
): T => {
  let expression = createExpression();

  for (
    let retry = 0;
    retry < MAX_ZERO_RETRIES &&
    includesZero(expression) &&
    Math.random() < retryRate;
    retry += 1
  ) {
    expression = createExpression();
  }

  return expression;
};

export const STAGES: StageDefinition[] = [
  {
    id: "stage1",
    baseQuestionCount: 10,
    answerMin: 0,
    answerMax: 18,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      requireNoMistake: true,
    },
    createExpression: () => {
      return retryZeroWeightedExpression(
        () => {
          const left = Math.floor(Math.random() * 10);
          const right = Math.floor(Math.random() * 10);
          return {
            left,
            right,
            operator: "+" as const,
            answer: left + right,
          };
        },
        (expression) => expression.left === 0 || expression.right === 0,
        STAGE1_ZERO_RETRY_RATE,
      );
    },
  },
  {
    id: "stage2",
    baseQuestionCount: 10,
    answerMin: 0,
    answerMax: 9,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      requireNoMistake: true,
    },
    createExpression: () => {
      return retryZeroWeightedExpression(
        () => {
          const left = Math.floor(Math.random() * 10);
          const right = Math.floor(Math.random() * (left + 1));
          return {
            left,
            right,
            operator: "-" as const,
            answer: left - right,
          };
        },
        (expression) => expression.right === 0 || expression.answer === 0,
        STAGE2_ZERO_RETRY_RATE,
      );
    },
  },
  {
    id: "stage3",
    baseQuestionCount: 10,
    answerMin: 0,
    answerMax: 9,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      requireNoMistake: true,
    },
    createExpression: () => {
      return retryZeroWeightedExpression(
        () => {
          const answer = Math.floor(Math.random() * 10);
          const right = Math.floor(Math.random() * 9) + 1;
          return {
            left: answer + right,
            right,
            operator: "-" as const,
            answer,
          };
        },
        (expression) => expression.answer === 0,
        STAGE3_ZERO_RETRY_RATE,
      );
    },
  },
];
