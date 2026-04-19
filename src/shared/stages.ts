import type { StageDefinition } from "./types";

export const STAGES: StageDefinition[] = [
  {
    id: "stage1",
    name: "Stage 1",
    tag: "Addition",
    description: "Single-digit addition (0-9 + 0-9)",
    baseQuestionCount: 10,
    answerMin: 0,
    answerMax: 18,
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
    name: "Stage 2",
    tag: "Subtraction",
    description: "Single-digit subtraction (0-9 - 0-9)",
    baseQuestionCount: 10,
    answerMin: 0,
    answerMax: 9,
    createExpression: () => {
      const left = Math.floor(Math.random() * 10);
      const right = Math.floor(Math.random() * (left + 1));
      return {
        left,
        right,
        operator: "-" as const,
        answer: left - right,
      };
    },
  },
  {
    id: "stage3",
    name: "Stage 3",
    tag: "Subtraction+",
    description: "1-2 digits minus 1 digit (result 0-9)",
    baseQuestionCount: 10,
    answerMin: 0,
    answerMax: 9,
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
