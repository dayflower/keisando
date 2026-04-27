import type { QuestionOption, QuestionOptionLabelSegment } from "./types";

export const createQuestionOption = (
  segments: QuestionOptionLabelSegment[],
  isCorrect: boolean,
): QuestionOption => ({
  segments,
  isCorrect,
});

export const createTextOnlyQuestionOption = (
  text: string,
  isCorrect: boolean,
): QuestionOption => createQuestionOption([{ text }], isCorrect);

export const getQuestionOptionText = (option: QuestionOption): string =>
  option.segments.map((segment) => segment.text).join(" ");
