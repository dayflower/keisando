import { UNLOCKED_STAGE_IDS_BY_PLAYER_STORAGE_KEY } from "../keys";
import { loadStoredJson, saveJson } from "./storageHelpers";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export const loadUnlockedStageIdsByPlayer = (): Record<string, string[]> => {
  const parsed = loadStoredJson<unknown>(
    UNLOCKED_STAGE_IDS_BY_PLAYER_STORAGE_KEY,
    {},
  );
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return Object.entries(parsed).reduce<Record<string, string[]>>(
    (result, [playerId, unlockedStageIds]) => {
      if (typeof playerId !== "string" || !isStringArray(unlockedStageIds)) {
        return result;
      }

      result[playerId] = Array.from(new Set(unlockedStageIds));
      return result;
    },
    {},
  );
};

export const saveUnlockedStageIdsByPlayer = (
  unlockedStageIdsByPlayer: Record<string, string[]>,
) => {
  saveJson(UNLOCKED_STAGE_IDS_BY_PLAYER_STORAGE_KEY, unlockedStageIdsByPlayer);
};
