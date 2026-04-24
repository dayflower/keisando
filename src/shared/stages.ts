import { type Locale, translate } from "./i18n";
import type { QuestionOption, StageDefinition } from "./types";

const STAGE1_ZERO_RETRY_RATE = 0.7;
const STAGE2_ZERO_RETRY_RATE = 0.7;
const STAGE3_ZERO_RETRY_RATE = 0.8;
const STAGE4_ZERO_RETRY_RATE = 0.7;
const STAGE5_ZERO_RETRY_RATE = 0.9;
const STAGE5_ONE_RETRY_RATE = 0.6;
const STAGE6_ZERO_RETRY_RATE = 0.9;
const STAGE6_ONE_RETRY_RATE = 0.6;
const STAGE7_ONE_RETRY_RATE = 0.6;
const STAGE8_ANSWER_ZERO_RETRY_RATE = 0.8;
const STAGE8_REMAINDER_ZERO_RETRY_RATE = 0.8;
const STAGE8_ONE_RETRY_RATE = 0.6;
const STAGE8_OPTION_SAMPLE_COUNT = 24;
const MAX_ZERO_RETRIES = 3;

type Stage8OptionCandidate = {
  quotient: number;
  remainder: number;
};

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

const retryWeightedAnswerExpression = <T extends { answer: number }>(
  createExpression: () => T,
  zeroRetryRate: number,
  oneRetryRate: number,
): T => {
  let expression = createExpression();

  for (let retry = 0; retry < MAX_ZERO_RETRIES; retry += 1) {
    const retryRate =
      expression.answer === 0
        ? zeroRetryRate
        : expression.answer === 1
          ? oneRetryRate
          : null;

    if (retryRate === null || Math.random() >= retryRate) {
      return expression;
    }

    expression = createExpression();
  }

  return expression;
};

const retryPredicateExpression = <T>(
  createExpression: () => T,
  getRetryRate: (expression: T) => number | null,
): T => {
  let expression = createExpression();

  for (let retry = 0; retry < MAX_ZERO_RETRIES; retry += 1) {
    const retryRate = getRetryRate(expression);
    if (retryRate === null || Math.random() >= retryRate) {
      return expression;
    }

    expression = createExpression();
  }

  return expression;
};

const buildStage8OptionLabel = (
  quotient: number,
  remainder: number,
  locale: Locale,
): string =>
  translate(locale, "common.remainderOption", { quotient, remainder });

const shuffleItems = <T>(items: T[]): T[] => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const buildStage8CandidatePool = (
  correct: Stage8OptionCandidate,
  divisor: number,
): Stage8OptionCandidate[] => {
  const pool: Stage8OptionCandidate[] = [];

  for (let quotient = 0; quotient <= 9; quotient += 1) {
    for (let remainder = 0; remainder < divisor; remainder += 1) {
      if (quotient === correct.quotient && remainder === correct.remainder) {
        continue;
      }

      pool.push({ quotient, remainder });
    }
  }

  return pool;
};

const pickStage8Distractors = (
  pool: Stage8OptionCandidate[],
): Stage8OptionCandidate[] => shuffleItems(pool).slice(0, 3);

const countDistinct = (values: number[]): number => new Set(values).size;

const scoreStage8Distractors = (
  correct: Stage8OptionCandidate,
  distractors: Stage8OptionCandidate[],
): number => {
  const quotientValues = [
    correct.quotient,
    ...distractors.map((item) => item.quotient),
  ];
  const remainderValues = [
    correct.remainder,
    ...distractors.map((item) => item.remainder),
  ];
  const distinctQuotients = countDistinct(quotientValues);
  const distinctRemainders = countDistinct(remainderValues);
  const sameQuotientCount = distractors.filter(
    (item) => item.quotient === correct.quotient,
  ).length;
  const sameRemainderCount = distractors.filter(
    (item) => item.remainder === correct.remainder,
  ).length;

  let score = 0;

  if (sameQuotientCount === 3) {
    score += 5;
  } else if (sameQuotientCount > 0) {
    score += 8;
  }

  if (sameRemainderCount === 3) {
    score += 5;
  } else if (sameRemainderCount > 0) {
    score += 7;
  }

  if (distinctQuotients === 4) {
    score += 5;
  } else if (distinctQuotients === 2 || distinctQuotients === 3) {
    score += 8;
  }

  if (distinctRemainders === 4) {
    score += 4;
  } else if (distinctRemainders === 2 || distinctRemainders === 3) {
    score += 6;
  }

  if (
    distractors.some(
      (item) =>
        item.quotient === correct.quotient &&
        item.remainder !== correct.remainder,
    )
  ) {
    score += 8;
  }

  if (
    distractors.some(
      (item) =>
        item.quotient !== correct.quotient &&
        item.remainder === correct.remainder,
    )
  ) {
    score += 8;
  }

  return score + Math.random();
};

const buildStage8Options = (
  correct: Stage8OptionCandidate,
  divisor: number,
  locale: Locale,
): Array<{ label: string; isCorrect: boolean }> => {
  const pool = buildStage8CandidatePool(correct, divisor);
  let bestDistractors = pickStage8Distractors(pool);
  let bestScore = scoreStage8Distractors(correct, bestDistractors);

  for (let sample = 1; sample < STAGE8_OPTION_SAMPLE_COUNT; sample += 1) {
    const distractors = pickStage8Distractors(pool);
    const score = scoreStage8Distractors(correct, distractors);

    if (score > bestScore) {
      bestDistractors = distractors;
      bestScore = score;
    }
  }

  return shuffleItems([
    {
      label: buildStage8OptionLabel(
        correct.quotient,
        correct.remainder,
        locale,
      ),
      isCorrect: true,
    },
    ...bestDistractors.map((item) => ({
      label: buildStage8OptionLabel(item.quotient, item.remainder, locale),
      isCorrect: false,
    })),
  ]);
};

const buildNumericOptions = (
  answer: number,
  answerMin: number,
  answerMax: number,
  formatOptionLabel?: (value: number) => string,
): QuestionOption[] => {
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

  return shuffleItems([...candidates]).map((value) => ({
    label: formatOptionLabel?.(value) ?? String(value),
    isCorrect: value === answer,
  }));
};

const stage9SourceStages: StageDefinition[] = [];

export const STAGES: StageDefinition[] = [
  {
    id: "stage1",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
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
    createOptions: (expression) =>
      buildNumericOptions(expression.answer, 0, 18),
  },
  {
    id: "stage2",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
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
    createOptions: (expression) => buildNumericOptions(expression.answer, 0, 9),
  },
  {
    id: "stage3",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
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
    createOptions: (expression) => buildNumericOptions(expression.answer, 0, 9),
  },
  {
    id: "stage4",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
    },
    createExpression: () => {
      return retryZeroWeightedExpression(
        () => {
          const left = Math.floor(Math.random() * 10);
          const right = Math.floor(Math.random() * 10);
          return {
            left,
            right,
            operator: "×" as const,
            answer: left * right,
          };
        },
        (expression) => expression.left === 0 || expression.right === 0,
        STAGE4_ZERO_RETRY_RATE,
      );
    },
    createOptions: (expression) =>
      buildNumericOptions(expression.answer, 0, 81),
  },
  {
    id: "stage5",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
    },
    createExpression: () => {
      return retryWeightedAnswerExpression(
        () => {
          const answer = Math.floor(Math.random() * 10);
          const right = Math.floor(Math.random() * 9) + 1;
          return {
            left: answer * right,
            right,
            operator: "×" as const,
            answer,
          };
        },
        STAGE5_ZERO_RETRY_RATE,
        STAGE5_ONE_RETRY_RATE,
      );
    },
    formatQuestion: (expression) =>
      `${expression.left} = ${expression.right} × ?`,
    formatOptionLabel: (value, expression) => `${expression.right} × ${value}`,
    createOptions: (expression) =>
      buildNumericOptions(
        expression.answer,
        0,
        9,
        (value) => `${expression.right} × ${value}`,
      ),
  },
  {
    id: "stage6",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
    },
    createExpression: () => {
      return retryWeightedAnswerExpression(
        () => {
          const answer = Math.floor(Math.random() * 10);
          const right = Math.floor(Math.random() * 9) + 1;
          return {
            left: answer * right,
            right,
            operator: "÷" as const,
            answer,
          };
        },
        STAGE6_ZERO_RETRY_RATE,
        STAGE6_ONE_RETRY_RATE,
      );
    },
    createOptions: (expression) => buildNumericOptions(expression.answer, 0, 9),
  },
  {
    id: "stage7",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
    },
    createExpression: () => {
      return retryWeightedAnswerExpression(
        () => {
          const answer = Math.floor(Math.random() * 10);
          const right = Math.floor(Math.random() * 8) + 2;
          const remainder = Math.floor(Math.random() * (right - 1)) + 1;
          return {
            left: right * answer + remainder,
            right,
            operator: "×" as const,
            answer,
            remainder,
          };
        },
        0,
        STAGE7_ONE_RETRY_RATE,
      );
    },
    formatQuestion: (expression) =>
      `${expression.left} = ${expression.right} × ? + ${expression.remainder ?? 0}`,
    formatOptionLabel: (value, expression) =>
      `${value} (${expression.right * value})`,
    createOptions: (expression) =>
      buildNumericOptions(
        expression.answer,
        0,
        9,
        (value) => `${value} (${expression.right * value})`,
      ),
  },
  {
    id: "stage8",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
    },
    createExpression: () => {
      return retryPredicateExpression(
        () => {
          const answer = Math.floor(Math.random() * 10);
          const right = Math.floor(Math.random() * 8) + 2;
          const remainder = Math.floor(Math.random() * right);
          return {
            left: right * answer + remainder,
            right,
            operator: "÷" as const,
            answer,
            remainder,
          };
        },
        (expression) => {
          if (expression.answer === 0) {
            return STAGE8_ANSWER_ZERO_RETRY_RATE;
          }

          if (expression.remainder === 0) {
            return STAGE8_REMAINDER_ZERO_RETRY_RATE;
          }

          if (expression.answer === 1) {
            return STAGE8_ONE_RETRY_RATE;
          }

          return null;
        },
      );
    },
    createOptions: (expression, locale) => {
      return buildStage8Options(
        {
          quotient: expression.answer,
          remainder: expression.remainder ?? 0,
        },
        expression.right,
        locale,
      );
    },
  },
  {
    id: "stage9",
    baseQuestionCount: 10,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
    },
    createExpression: () => {
      const selectedStage =
        stage9SourceStages[
          Math.floor(Math.random() * stage9SourceStages.length)
        ];

      if (!selectedStage) {
        throw new Error("Stage 9 source stages are not configured.");
      }

      return selectedStage.createExpression();
    },
    createOptions: (expression, locale) => {
      if (expression.operator === "÷" && expression.remainder !== undefined) {
        return buildStage8Options(
          {
            quotient: expression.answer,
            remainder: expression.remainder,
          },
          expression.right,
          locale,
        );
      }

      return buildNumericOptions(expression.answer, 0, 81);
    },
  },
];

stage9SourceStages.push(STAGES[0], STAGES[2], STAGES[3], STAGES[7]);
