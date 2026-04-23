import { UNLOCKED_STAGE_IDS_BY_PLAYER_STORAGE_KEY } from "../keys";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export const loadUnlockedStageIdsByPlayer = (): Record<string, string[]> => {
  try {
    const raw = localStorage.getItem(UNLOCKED_STAGE_IDS_BY_PLAYER_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
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
  } catch {
    return {};
  }
};

export const saveUnlockedStageIdsByPlayer = (
  unlockedStageIdsByPlayer: Record<string, string[]>,
) => {
  try {
    localStorage.setItem(
      UNLOCKED_STAGE_IDS_BY_PLAYER_STORAGE_KEY,
      JSON.stringify(unlockedStageIdsByPlayer),
    );
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};
