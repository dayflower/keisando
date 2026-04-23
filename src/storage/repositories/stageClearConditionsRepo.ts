import type { StageClearCondition } from "../../shared/types";
import { STAGE_CLEAR_CONDITIONS_STORAGE_KEY } from "../keys";

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
    typeof condition.requireNoMistake === "boolean"
  );
};

export const loadStageClearConditionOverrides = (): Record<
  string,
  StageClearCondition
> => {
  try {
    const raw = localStorage.getItem(STAGE_CLEAR_CONDITIONS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
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
  } catch {
    return {};
  }
};

export const saveStageClearConditionOverrides = (
  overrides: Record<string, StageClearCondition>,
) => {
  try {
    localStorage.setItem(
      STAGE_CLEAR_CONDITIONS_STORAGE_KEY,
      JSON.stringify(overrides),
    );
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};
