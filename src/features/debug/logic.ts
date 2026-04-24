import type { StageDefinition } from "../../shared/types";

export const unlockAllStagesForPlayer = (
  unlockedStageIdsByPlayer: Record<string, string[]>,
  playerId: string,
  stages: StageDefinition[],
): Record<string, string[]> => ({
  ...unlockedStageIdsByPlayer,
  [playerId]: stages.slice(1).map((stage) => stage.id),
});
