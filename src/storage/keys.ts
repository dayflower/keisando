export const USERS_STORAGE_KEY = "keisando:users";
export const CURRENT_USER_ID_STORAGE_KEY = "keisando:current-user-id";
export const RECORDS_STORAGE_KEY = "keisando:records:v1";

export const getHistoryStorageKey = (playerId: string): string =>
  `keisando:user:${playerId}:history`;

export const getLifetimeSummaryStorageKey = (playerId: string): string =>
  `keisando:user:${playerId}:lifetime-summary`;

export const getStageSummaryStorageKey = (playerId: string): string =>
  `keisando:user:${playerId}:stage-lifetime-summary`;
