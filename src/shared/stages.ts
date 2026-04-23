import type { StageDefinition } from "./types";

const STAGE2_ZERO_RETRY_RATE = 0.7;
const STAGE2_MAX_RETRIES = 3;

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
      const left = Math.floor(Math.random() * 10);
      const right = Math.floor(Math.random() * 10);
      return {
        left,
        right,
        operator: "+" as const,
        answer: left + right,
      };
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
      let left = 0;
      let right = 0;
      let answer = 0;

      // Keep zeros possible, but probabilistically retry to reduce over-frequency.
      for (let retry = 0; retry < STAGE2_MAX_RETRIES; retry += 1) {
        left = Math.floor(Math.random() * 10);
        right = Math.floor(Math.random() * (left + 1));
        answer = left - right;
        const includesZero = right === 0 || answer === 0;
        if (!includesZero || Math.random() >= STAGE2_ZERO_RETRY_RATE) {
          break;
        }
      }

      return {
        left,
        right,
        operator: "-" as const,
        answer,
      };
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
      const answer = Math.floor(Math.random() * 10);
      const right = Math.floor(Math.random() * 9) + 1;
      const left = answer + right;
      return {
        left,
        right,
        operator: "-" as const,
        answer,
      };
    },
  },
];
