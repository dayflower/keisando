import type { StageClearCondition } from "../../shared/types";
import { STAGE_CLEAR_CONDITIONS_STORAGE_KEY } from "../keys";
import { loadStoredJson, saveJson } from "./storageHelpers";

const isValidClearCondition = (
  value: unknown,
): value is StageClearCondition => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const condition = value as Partial<StageClearCondition>;

  return (
    typeof condition.maxElapsedMs === "number" &&
    Number.isFinite(condition.maxElapsedMs) &&
    condition.maxElapsedMs >= 100 &&
    typeof condition.maxMistakes === "number" &&
    Number.isFinite(condition.maxMistakes)
  );
};

export const loadStageClearConditionOverrides = (): Record<
  string,
  StageClearCondition
> => {
  const parsed = loadStoredJson<unknown>(
    STAGE_CLEAR_CONDITIONS_STORAGE_KEY,
    {},
  );
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return Object.entries(parsed).reduce<Record<string, StageClearCondition>>(
    (result, [stageId, condition]) => {
      if (typeof stageId === "string" && isValidClearCondition(condition)) {
        result[stageId] = condition;
      }

      return result;
    },
    {},
  );
};

export const saveStageClearConditionOverrides = (
  overrides: Record<string, StageClearCondition>,
) => {
  saveJson(STAGE_CLEAR_CONDITIONS_STORAGE_KEY, overrides);
};
