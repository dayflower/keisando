import type {
  Question,
  StageDefinition,
  StageExpression,
} from "../../shared/types";

export const calculateScore = (
  durationMs: number,
  wrongCount: number,
): number => {
  const denominator = Math.max(durationMs + wrongCount * 1000, 1);
  return Math.round(1_000_000 / denominator);
};

const shuffle = <T>(items: T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const createOptions = (
  answer: number,
  answerMin: number,
  answerMax: number,
): number[] => {
  const candidates = new Set<number>([answer]);
  let guard = 0;

  while (candidates.size < 4 && guard < 200) {
    const offset = Math.floor(Math.random() * 9) - 4;
    const value = Math.max(answerMin, Math.min(answerMax, answer + offset));
    if (value !== answer) {
      candidates.add(value);
    }
    guard += 1;
  }

  for (
    let value = answerMin;
    candidates.size < 4 && value <= answerMax;
    value += 1
  ) {
    if (value !== answer) {
      candidates.add(value);
    }
  }

  return shuffle([...candidates]);
};

export const createQuestion = (
  stage: StageDefinition,
  usedExpressions: Set<string>,
): Question => {
  const maxUnique = 200;
  if (usedExpressions.size >= maxUnique) {
    usedExpressions.clear();
  }

  let expression: StageExpression;
  let key: string;
  do {
    expression = stage.createExpression();
    key = `${expression.left}${expression.operator}${expression.right}`;
  } while (usedExpressions.has(key));

  usedExpressions.add(key);

  return {
    ...expression,
    options: createOptions(expression.answer, stage.answerMin, stage.answerMax),
  };
};
