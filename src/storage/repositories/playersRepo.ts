import {
  PLAYER_NAME_MAX_LENGTH,
  PLAYER_NAME_MIN_LENGTH,
} from "../../shared/constants";
import type { Player } from "../../shared/types";
import { CURRENT_USER_ID_STORAGE_KEY, USERS_STORAGE_KEY } from "../keys";

const normalizePlayerName = (value: string): string => value.trim();

const isValidPlayerName = (name: string): boolean =>
  name.length >= PLAYER_NAME_MIN_LENGTH &&
  name.length <= PLAYER_NAME_MAX_LENGTH;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const loadPlayers = (): Player[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

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
  } catch {
    return [];
  }
};

export const savePlayers = (players: Player[]) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(players));
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

export const loadActivePlayerId = (): string | null => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_ID_STORAGE_KEY);
    if (!raw) return null;
    return raw;
  } catch {
    return null;
  }
};

export const saveActivePlayerId = (activePlayerId: string | null) => {
  try {
    if (activePlayerId === null) {
      localStorage.removeItem(CURRENT_USER_ID_STORAGE_KEY);
      return;
    }

    localStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, activePlayerId);
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

export const normalizeAndValidatePlayerName = (
  value: string,
): string | null => {
  const normalized = normalizePlayerName(value);
  return isValidPlayerName(normalized) ? normalized : null;
};
