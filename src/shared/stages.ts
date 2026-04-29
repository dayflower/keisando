import { type Locale, translate } from "./i18n";
import {
  createQuestionOption,
  createTextOnlyQuestionOption,
} from "./questionOptions";
import type {
  QuestionOption,
  QuestionOptionLabelSegment,
  StageDefinition,
} from "./types";

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
const STAGE8_SAME_QUOTIENT_OPTION_RATE = 0.25;
const STAGE9_BALANCED_SOURCE_REPEAT_COUNT = 5;
const STAGE10_MIXED_COMPARISON_RATE = 0.5;
const STAGE10_PRODUCT_DIFFERENCE_MAX = 8;
const MAX_ZERO_RETRIES = 3;

type Stage8OptionCandidate = {
  quotient: number;
  remainder: number;
};

type Stage10MultiplicationComparisonCandidate = {
  leftFactorA: number;
  leftFactorB: number;
  rightFactorA: number;
  rightFactorB: number;
  left: number;
  right: number;
};

const buildStage5OptionSegments = (
  value: number,
  multiplier: number,
): QuestionOptionLabelSegment[] => [
  { text: `${multiplier} ×`, size: "small" },
  { text: String(value) },
];

const buildStage7OptionSegments = (
  value: number,
  product: number,
): QuestionOptionLabelSegment[] => [
  { text: String(value) },
  { text: `(${product})`, size: "small" },
];

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

const pickStage8Candidate = (
  pool: Stage8OptionCandidate[],
): Stage8OptionCandidate => {
  const [candidate] = shuffleItems(pool);

  if (!candidate) {
    throw new Error("Stage 8 option pool is empty.");
  }

  return candidate;
};

const buildSameQuotientStage8Distractors = (
  correct: Stage8OptionCandidate,
  pool: Stage8OptionCandidate[],
): Stage8OptionCandidate[] | null => {
  const sameQuotientPool = pool.filter(
    (item) =>
      item.quotient === correct.quotient &&
      item.remainder !== correct.remainder,
  );

  if (sameQuotientPool.length < 3) {
    return null;
  }

  return shuffleItems(sameQuotientPool).slice(0, 3);
};

const buildGuaranteedStage8Distractors = (
  correct: Stage8OptionCandidate,
  pool: Stage8OptionCandidate[],
): Stage8OptionCandidate[] => {
  const sameQuotientPool = pool.filter(
    (item) =>
      item.quotient === correct.quotient &&
      item.remainder !== correct.remainder,
  );
  const sameRemainderPool = pool.filter(
    (item) =>
      item.quotient !== correct.quotient &&
      item.remainder === correct.remainder,
  );
  const requiredDistractors = [
    pickStage8Candidate(sameQuotientPool),
    pickStage8Candidate(sameRemainderPool),
  ];
  const remainingPool = pool.filter(
    (item) =>
      !requiredDistractors.some(
        (selected) =>
          selected.quotient === item.quotient &&
          selected.remainder === item.remainder,
      ),
  );
  const optionalDistractor = pickStage8Candidate(remainingPool);

  return [...requiredDistractors, optionalDistractor];
};

const buildStage8Distractors = (
  correct: Stage8OptionCandidate,
  pool: Stage8OptionCandidate[],
): Stage8OptionCandidate[] => {
  if (Math.random() < STAGE8_SAME_QUOTIENT_OPTION_RATE) {
    const sameQuotientDistractors = buildSameQuotientStage8Distractors(
      correct,
      pool,
    );

    if (sameQuotientDistractors) {
      return sameQuotientDistractors;
    }
  }

  return buildGuaranteedStage8Distractors(correct, pool);
};

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
): QuestionOption[] => {
  const pool = buildStage8CandidatePool(correct, divisor);
  let bestDistractors = buildStage8Distractors(correct, pool);
  let bestScore = scoreStage8Distractors(correct, bestDistractors);

  for (let sample = 1; sample < STAGE8_OPTION_SAMPLE_COUNT; sample += 1) {
    const distractors = buildStage8Distractors(correct, pool);
    const score = scoreStage8Distractors(correct, distractors);

    if (score > bestScore) {
      bestDistractors = distractors;
      bestScore = score;
    }
  }

  return shuffleItems([
    createTextOnlyQuestionOption(
      buildStage8OptionLabel(correct.quotient, correct.remainder, locale),
      true,
    ),
    ...bestDistractors.map((item) =>
      createTextOnlyQuestionOption(
        buildStage8OptionLabel(item.quotient, item.remainder, locale),
        false,
      ),
    ),
  ]);
};

const buildNumericOptions = (
  answer: number,
  answerMin: number,
  answerMax: number,
  formatSegments?: (value: number) => QuestionOptionLabelSegment[],
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

  return shuffleItems([...candidates]).map((value) =>
    createQuestionOption(
      formatSegments?.(value) ?? [{ text: String(value) }],
      value === answer,
    ),
  );
};

const buildStage10ProductLabel = (left: number, right: number): string =>
  `${left} × ${right}`;

const hasSharedFactor = (
  leftFactors: [number, number],
  rightFactors: [number, number],
): boolean => {
  const rightSet = new Set(rightFactors);
  return leftFactors.some((factor) => rightSet.has(factor));
};

const buildStage10ChoiceOptions = (expression: {
  leftLabel?: string;
  rightLabel?: string;
  left: number;
  right: number;
  answer: number;
}): QuestionOption[] => {
  const leftLabel = expression.leftLabel ?? String(expression.left);
  const rightLabel = expression.rightLabel ?? String(expression.right);

  return [
    createTextOnlyQuestionOption(leftLabel, expression.answer === 0),
    createTextOnlyQuestionOption(rightLabel, expression.answer === 1),
  ];
};

const buildStage10MultiplicationComparisonPool =
  (): Stage10MultiplicationComparisonCandidate[] => {
    const pool: Stage10MultiplicationComparisonCandidate[] = [];

    for (let leftFactorA = 2; leftFactorA <= 9; leftFactorA += 1) {
      for (let leftFactorB = leftFactorA; leftFactorB <= 9; leftFactorB += 1) {
        for (let rightFactorA = 2; rightFactorA <= 9; rightFactorA += 1) {
          for (
            let rightFactorB = rightFactorA;
            rightFactorB <= 9;
            rightFactorB += 1
          ) {
            const left = leftFactorA * leftFactorB;
            const right = rightFactorA * rightFactorB;

            if (left === right) {
              continue;
            }

            if (
              Math.abs(left - right) > STAGE10_PRODUCT_DIFFERENCE_MAX ||
              hasSharedFactor(
                [leftFactorA, leftFactorB],
                [rightFactorA, rightFactorB],
              )
            ) {
              continue;
            }

            pool.push({
              leftFactorA,
              leftFactorB,
              rightFactorA,
              rightFactorB,
              left,
              right,
            });
          }
        }
      }
    }

    return pool;
  };

const stage10MultiplicationComparisonPool =
  buildStage10MultiplicationComparisonPool();

const createStage10MultiplicationComparison = () => {
  const candidateIndex = Math.floor(
    Math.random() * stage10MultiplicationComparisonPool.length,
  );
  const candidate = stage10MultiplicationComparisonPool[candidateIndex];

  if (!candidate) {
    throw new Error("Stage 10 multiplication comparison pool is empty.");
  }

  const swapSides = Math.random() < 0.5;
  const leftFactorA = swapSides
    ? candidate.rightFactorA
    : candidate.leftFactorA;
  const leftFactorB = swapSides
    ? candidate.rightFactorB
    : candidate.leftFactorB;
  const rightFactorA = swapSides
    ? candidate.leftFactorA
    : candidate.rightFactorA;
  const rightFactorB = swapSides
    ? candidate.leftFactorB
    : candidate.rightFactorB;
  const left = swapSides ? candidate.right : candidate.left;
  const right = swapSides ? candidate.left : candidate.right;

  return {
    left,
    right,
    operator: "×" as const,
    answer: left > right ? 0 : 1,
    leftLabel: buildStage10ProductLabel(leftFactorA, leftFactorB),
    rightLabel: buildStage10ProductLabel(rightFactorA, rightFactorB),
  };
};

const createStage10MixedComparison = () => {
  const multiplicationLeft = Math.random() < 0.5;
  const factorA = Math.floor(Math.random() * 8) + 2;
  const factorB = Math.floor(Math.random() * 8) + 2;
  const product = factorA * factorB;
  const offset = Math.floor(Math.random() * 11) - 5;
  const rawValue = Math.max(
    1,
    Math.min(81, product + (offset >= 0 ? offset + 1 : offset)),
  );

  if (rawValue === product) {
    return createStage10MixedComparison();
  }

  const left = multiplicationLeft ? product : rawValue;
  const right = multiplicationLeft ? rawValue : product;

  return {
    left,
    right,
    operator: "×" as const,
    answer: left > right ? 0 : 1,
    leftLabel: multiplicationLeft
      ? buildStage10ProductLabel(factorA, factorB)
      : String(rawValue),
    rightLabel: multiplicationLeft
      ? String(rawValue)
      : buildStage10ProductLabel(factorA, factorB),
  };
};

const stage9SourceStages: StageDefinition[] = [];
let stage9RoundQueue: StageDefinition[] = [];

const initializeStage9RoundQueue = () => {
  stage9RoundQueue = Array.from(
    { length: STAGE9_BALANCED_SOURCE_REPEAT_COUNT },
    () => shuffleItems(stage9SourceStages),
  ).flat();
};

const shiftStage9SourceStage = (): StageDefinition => {
  if (stage9RoundQueue.length === 0) {
    initializeStage9RoundQueue();
  }

  const selectedStage = stage9RoundQueue.shift();

  if (!selectedStage) {
    throw new Error("Stage 9 source stages are not configured.");
  }

  return selectedStage;
};

export const STAGES: StageDefinition[] = [
  {
    id: "stage1",
    baseQuestionCount: 20,
    defaultClearCondition: {
      maxElapsedMs: 40_000,
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
    baseQuestionCount: 20,
    defaultClearCondition: {
      maxElapsedMs: 40_000,
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
    baseQuestionCount: 20,
    defaultClearCondition: {
      maxElapsedMs: 45_000,
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
    baseQuestionCount: 20,
    defaultClearCondition: {
      maxElapsedMs: 50_000,
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
    baseQuestionCount: 20,
    defaultClearCondition: {
      maxElapsedMs: 60_000,
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
    createOptions: (expression) =>
      buildNumericOptions(expression.answer, 0, 9, (value) =>
        buildStage5OptionSegments(value, expression.right),
      ),
  },
  {
    id: "stage6",
    baseQuestionCount: 20,
    defaultClearCondition: {
      maxElapsedMs: 60_000,
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
    baseQuestionCount: 20,
    defaultClearCondition: {
      maxElapsedMs: 60_000,
      maxMistakes: 0,
    },
    createExpression: () =>
      Math.random() < STAGE10_MIXED_COMPARISON_RATE
        ? createStage10MixedComparison()
        : createStage10MultiplicationComparison(),
    formatQuestion: (_expression, locale) =>
      locale === "ja" ? "どっちが大きい?" : "Which is greater?",
    createOptions: (expression) => buildStage10ChoiceOptions(expression),
  },
  {
    id: "stage8",
    baseQuestionCount: 20,
    defaultClearCondition: {
      maxElapsedMs: 75_000,
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
    createOptions: (expression) =>
      buildNumericOptions(expression.answer, 0, 9, (value) =>
        buildStage7OptionSegments(value, expression.right * value),
      ),
  },
  {
    id: "stage9",
    baseQuestionCount: 20,
    defaultClearCondition: {
      maxElapsedMs: 120_000,
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
    id: "stage10",
    baseQuestionCount: 20,
    defaultClearCondition: {
      maxElapsedMs: 90_000,
      maxMistakes: 0,
    },
    initializeRound: () => {
      initializeStage9RoundQueue();
    },
    createExpression: () => {
      return shiftStage9SourceStage().createExpression();
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

stage9SourceStages.push(STAGES[0], STAGES[2], STAGES[3], STAGES[8]);
