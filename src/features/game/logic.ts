import type { Locale } from "../../shared/i18n";
import type {
  Question,
  StageDefinition,
  StageExpression,
} from "../../shared/types";

const formatQuestion = (
  stage: StageDefinition,
  expression: StageExpression,
  locale: Locale,
): string =>
  stage.formatQuestion?.(expression, locale) ??
  `${expression.left} ${expression.operator} ${expression.right} = ?`;

const createQuestionOptions = (
  stage: StageDefinition,
  expression: StageExpression,
  locale: Locale,
) => stage.createOptions(expression, locale);

export const createQuestion = (
  stage: StageDefinition,
  usedExpressions: Set<string>,
  locale: Locale = "en",
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
    prompt: formatQuestion(stage, expression, locale),
    options: createQuestionOptions(stage, expression, locale),
  };
};
