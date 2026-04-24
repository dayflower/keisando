import type { StageDefinition } from "../../shared/types";

export const getNextStage = (
  stageId: string,
  stages: StageDefinition[],
): StageDefinition | null => {
  const currentStageIndex = stages.findIndex((stage) => stage.id === stageId);
  if (currentStageIndex < 0 || currentStageIndex + 1 >= stages.length) {
    return null;
  }

  return stages[currentStageIndex + 1] ?? null;
};

export const getNextPlayableStage = (
  stageId: string,
  unlockedStageIds: Set<string>,
  stages: StageDefinition[],
): StageDefinition | null => {
  const nextStage = getNextStage(stageId, stages);
  if (!nextStage || !unlockedStageIds.has(nextStage.id)) {
    return null;
  }

  return nextStage;
};
