import type {
  Question,
  QuestionOption,
  StageDefinition,
  StageExpression,
} from "../../shared/types";

const shuffle = <T>(items: T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export const createOptions = (
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

const formatQuestion = (
  stage: StageDefinition,
  expression: StageExpression,
): string =>
  stage.formatQuestion?.(expression) ??
  `${expression.left} ${expression.operator} ${expression.right} = ?`;

const createQuestionOptions = (
  stage: StageDefinition,
  expression: StageExpression,
): QuestionOption[] =>
  createOptions(expression.answer, stage.answerMin, stage.answerMax).map(
    (value) => ({
      label: stage.formatOptionLabel?.(value, expression) ?? String(value),
      isCorrect: value === expression.answer,
    }),
  );

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
    left: expression.left,
    right: expression.right,
    operator: expression.operator,
    prompt: formatQuestion(stage, expression),
    options: createQuestionOptions(stage, expression),
  };
};
