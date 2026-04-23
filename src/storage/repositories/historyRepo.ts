import type {
  PlayerLifetimeSummary,
  PlayHistoryRecord,
  StageLifetimeSummary,
} from "../../shared/types";
import {
  getHistoryStorageKey,
  getLifetimeSummaryStorageKey,
  getStageSummaryStorageKey,
} from "../keys";
import { loadStoredJson, saveJson } from "./storageHelpers";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const createDefaultLifetimeSummary = (
  playerId: string,
): PlayerLifetimeSummary => ({
  playerId,
  totalPlays: 0,
  totalClears: 0,
  lastPlayedAt: null,
});

export const loadPlayerHistory = (playerId: string): PlayHistoryRecord[] => {
  const parsed = loadStoredJson<unknown[]>(getHistoryStorageKey(playerId), []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((candidate): candidate is PlayHistoryRecord => {
    if (!candidate || typeof candidate !== "object") return false;
    const record = candidate as Partial<PlayHistoryRecord>;
    return (
      typeof record.id === "string" &&
      typeof record.playerId === "string" &&
      record.playerId === playerId &&
      isFiniteNumber(record.playedAt) &&
      typeof record.stageId === "string" &&
      (record.result === "clear" || record.result === "fail") &&
      isFiniteNumber(record.durationMs) &&
      record.durationMs >= 0 &&
      isFiniteNumber(record.mistakeCount) &&
      record.mistakeCount >= 0 &&
      typeof record.appVersion === "string"
    );
  });
};

export const savePlayerHistory = (
  playerId: string,
  records: PlayHistoryRecord[],
) => {
  saveJson(getHistoryStorageKey(playerId), records);
};

export const loadLifetimeSummary = (
  playerId: string,
): PlayerLifetimeSummary => {
  const parsed = loadStoredJson<Partial<PlayerLifetimeSummary> | null>(
    getLifetimeSummaryStorageKey(playerId),
    null,
  );
  if (!parsed || typeof parsed !== "object") {
    return createDefaultLifetimeSummary(playerId);
  }

  if (
    parsed.playerId !== playerId ||
    !isFiniteNumber(parsed.totalPlays) ||
    parsed.totalPlays < 0 ||
    !isFiniteNumber(parsed.totalClears) ||
    parsed.totalClears < 0
  ) {
    return createDefaultLifetimeSummary(playerId);
  }

  return {
    playerId,
    totalPlays: parsed.totalPlays,
    totalClears: parsed.totalClears,
    lastPlayedAt:
      parsed.lastPlayedAt === null || isFiniteNumber(parsed.lastPlayedAt)
        ? (parsed.lastPlayedAt ?? null)
        : null,
  };
};

export const saveLifetimeSummary = (
  playerId: string,
  summary: PlayerLifetimeSummary,
) => {
  saveJson(getLifetimeSummaryStorageKey(playerId), summary);
};

export const loadStageSummaries = (
  playerId: string,
): StageLifetimeSummary[] => {
  const parsed = loadStoredJson<unknown[]>(
    getStageSummaryStorageKey(playerId),
    [],
  );
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((candidate): candidate is StageLifetimeSummary => {
    if (!candidate || typeof candidate !== "object") return false;
    const summary = candidate as Partial<StageLifetimeSummary>;
    return (
      summary.playerId === playerId &&
      typeof summary.stageId === "string" &&
      isFiniteNumber(summary.attempts) &&
      summary.attempts >= 0 &&
      isFiniteNumber(summary.clears) &&
      summary.clears >= 0 &&
      (summary.bestDurationMs === null ||
        isFiniteNumber(summary.bestDurationMs))
    );
  });
};

export const saveStageSummaries = (
  playerId: string,
  summaries: StageLifetimeSummary[],
) => {
  saveJson(getStageSummaryStorageKey(playerId), summaries);
};
