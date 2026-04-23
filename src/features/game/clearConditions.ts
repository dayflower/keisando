import type { StageClearCondition, StageRunRecord } from "../../shared/types";

const MIN_CLEAR_TIME_MS = 100;

export const normalizeClearCondition = (
  candidate: Partial<StageClearCondition> | null | undefined,
  fallback: StageClearCondition,
): StageClearCondition => {
  const maxElapsedMs = candidate?.maxElapsedMs;
  const requireNoMistake = candidate?.requireNoMistake;

  return {
    maxElapsedMs:
      typeof maxElapsedMs === "number" && Number.isFinite(maxElapsedMs)
        ? Math.max(Math.round(maxElapsedMs), MIN_CLEAR_TIME_MS)
        : fallback.maxElapsedMs,
    requireNoMistake:
      typeof requireNoMistake === "boolean"
        ? requireNoMistake
        : fallback.requireNoMistake,
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

  if (condition.requireNoMistake && wrongCount > 0) {
    return false;
  }

  return true;
};

export const isRecordStageConditionClear = (
  record: StageRunRecord,
  condition: StageClearCondition,
): boolean =>
  isStageConditionClear(record.elapsedMs, record.wrongCount, condition);
