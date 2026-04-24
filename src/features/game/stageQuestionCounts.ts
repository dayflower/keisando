import type { StageDefinition } from "../../shared/types";

const MIN_STAGE_QUESTION_COUNT = 1;

export const normalizeStageQuestionCount = (
  candidate: number | null | undefined,
  fallback: number,
): number =>
  typeof candidate === "number" && Number.isFinite(candidate)
    ? Math.max(Math.round(candidate), MIN_STAGE_QUESTION_COUNT)
    : fallback;

export const applyStageQuestionCountOverride = (
  stage: StageDefinition,
  questionCountOverride: number | null | undefined,
): StageDefinition => ({
  ...stage,
  baseQuestionCount: normalizeStageQuestionCount(
    questionCountOverride,
    stage.baseQuestionCount,
  ),
});
