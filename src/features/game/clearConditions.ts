import type { StageClearCondition, StageRunRecord } from "../../shared/types";

const MIN_CLEAR_TIME_MS = 100;

export const normalizeClearCondition = (
  candidate: Partial<StageClearCondition> | null | undefined,
  fallback: StageClearCondition,
): StageClearCondition => {
  const maxElapsedMs = candidate?.maxElapsedMs;
  const maxMistakes = candidate?.maxMistakes;

  return {
    maxElapsedMs:
      typeof maxElapsedMs === "number" && Number.isFinite(maxElapsedMs)
        ? Math.max(Math.round(maxElapsedMs), MIN_CLEAR_TIME_MS)
        : fallback.maxElapsedMs,
    maxMistakes:
      typeof maxMistakes === "number" && Number.isFinite(maxMistakes)
        ? Math.round(maxMistakes)
        : fallback.maxMistakes,
  };
};

export const isStageConditionClear = (
  elapsedMs: number,
  wrongCount: number,
  condition: StageClearCondition,
): boolean => {
  if (elapsedMs > condition.maxElapsedMs) {
    return false;
  }

  if (condition.maxMistakes >= 0 && wrongCount > condition.maxMistakes) {
    return false;
  }

  return true;
};

export const isRecordStageConditionClear = (
  record: StageRunRecord,
  condition: StageClearCondition,
): boolean =>
  isStageConditionClear(record.elapsedMs, record.wrongCount, condition);
