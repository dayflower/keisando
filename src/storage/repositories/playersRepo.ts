import {
  PLAYER_NAME_MAX_LENGTH,
  PLAYER_NAME_MIN_LENGTH,
} from "../../shared/constants";
import type { Player } from "../../shared/types";
import { CURRENT_USER_ID_STORAGE_KEY, USERS_STORAGE_KEY } from "../keys";
import {
  loadStoredJson,
  loadStoredValue,
  removeStoredValue,
  saveJson,
  saveStoredValue,
} from "./storageHelpers";

const normalizePlayerName = (value: string): string => value.trim();

const isValidPlayerName = (name: string): boolean =>
  name.length >= PLAYER_NAME_MIN_LENGTH &&
  name.length <= PLAYER_NAME_MAX_LENGTH;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const loadPlayers = (): Player[] => {
  const parsed = loadStoredJson<unknown[]>(USERS_STORAGE_KEY, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((candidate): candidate is Player => {
      if (!candidate || typeof candidate !== "object") return false;
      const player = candidate as Partial<Player>;
      return (
        typeof player.id === "string" &&
        typeof player.name === "string" &&
        isValidPlayerName(normalizePlayerName(player.name)) &&
        isFiniteNumber(player.createdAt)
      );
    })
    .map((player) => ({
      id: player.id,
      name: normalizePlayerName(player.name),
      createdAt: player.createdAt,
    }));
};

export const savePlayers = (players: Player[]) => {
  saveJson(USERS_STORAGE_KEY, players);
};

export const loadActivePlayerId = (): string | null => {
  return loadStoredValue(CURRENT_USER_ID_STORAGE_KEY);
};

export const saveActivePlayerId = (activePlayerId: string | null) => {
  if (activePlayerId === null) {
    removeStoredValue(CURRENT_USER_ID_STORAGE_KEY);
    return;
  }

  saveStoredValue(CURRENT_USER_ID_STORAGE_KEY, activePlayerId);
};

export const normalizeAndValidatePlayerName = (
  value: string,
): string | null => {
  const normalized = normalizePlayerName(value);
  return isValidPlayerName(normalized) ? normalized : null;
};
