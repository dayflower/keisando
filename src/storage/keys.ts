export const USERS_STORAGE_KEY = "keisando:users";
export const CURRENT_USER_ID_STORAGE_KEY = "keisando:current-user-id";
export const RECORDS_STORAGE_KEY = "keisando:records:v1";
export const SOUND_MUTED_STORAGE_KEY = "keisando:sound-muted";
export const STAGE_CLEAR_CONDITIONS_STORAGE_KEY =
  "keisando:stage-clear-conditions:v1";
export const STAGE_QUESTION_COUNTS_STORAGE_KEY =
  "keisando:stage-question-counts:v1";
export const UNLOCKED_STAGE_IDS_BY_PLAYER_STORAGE_KEY =
  "keisando:unlocked-stage-ids-by-player:v1";

export const getHistoryStorageKey = (playerId: string): string =>
  `keisando:user:${playerId}:history`;

export const getLifetimeSummaryStorageKey = (playerId: string): string =>
  `keisando:user:${playerId}:lifetime-summary`;

export const getStageSummaryStorageKey = (playerId: string): string =>
  `keisando:user:${playerId}:stage-lifetime-summary`;
