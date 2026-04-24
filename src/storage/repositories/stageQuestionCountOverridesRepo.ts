import { STAGE_QUESTION_COUNTS_STORAGE_KEY } from "../keys";
import { loadStoredJson, saveJson } from "./storageHelpers";

const isValidQuestionCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export const loadStageQuestionCountOverrides = (): Record<string, number> => {
  const parsed = loadStoredJson<unknown>(STAGE_QUESTION_COUNTS_STORAGE_KEY, {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return Object.entries(parsed).reduce<Record<string, number>>(
    (result, [stageId, questionCount]) => {
      if (typeof stageId === "string" && isValidQuestionCount(questionCount)) {
        result[stageId] = questionCount;
      }

      return result;
    },
    {},
  );
};

export const saveStageQuestionCountOverrides = (
  overrides: Record<string, number>,
) => {
  saveJson(STAGE_QUESTION_COUNTS_STORAGE_KEY, overrides);
};
