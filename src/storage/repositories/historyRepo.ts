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

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const createDefaultLifetimeSummary = (
  playerId: string,
): PlayerLifetimeSummary => ({
  playerId,
  totalPlays: 0,
  totalClears: 0,
  totalScore: 0,
  bestScore: null,
  lastPlayedAt: null,
});

export const loadPlayerHistory = (playerId: string): PlayHistoryRecord[] => {
  try {
    const raw = localStorage.getItem(getHistoryStorageKey(playerId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

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
        isFiniteNumber(record.score) &&
        isFiniteNumber(record.durationMs) &&
        record.durationMs >= 0 &&
        isFiniteNumber(record.mistakeCount) &&
        record.mistakeCount >= 0 &&
        typeof record.appVersion === "string"
      );
    });
  } catch {
    return [];
  }
};

export const savePlayerHistory = (
  playerId: string,
  records: PlayHistoryRecord[],
) => {
  try {
    localStorage.setItem(
      getHistoryStorageKey(playerId),
      JSON.stringify(records),
    );
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

export const loadLifetimeSummary = (
  playerId: string,
): PlayerLifetimeSummary => {
  try {
    const raw = localStorage.getItem(getLifetimeSummaryStorageKey(playerId));
    if (!raw) return createDefaultLifetimeSummary(playerId);

    const parsed = JSON.parse(raw) as Partial<PlayerLifetimeSummary>;
    if (!parsed || typeof parsed !== "object") {
      return createDefaultLifetimeSummary(playerId);
    }

    if (
      parsed.playerId !== playerId ||
      !isFiniteNumber(parsed.totalPlays) ||
      parsed.totalPlays < 0 ||
      !isFiniteNumber(parsed.totalClears) ||
      parsed.totalClears < 0 ||
      !isFiniteNumber(parsed.totalScore) ||
      parsed.totalScore < 0
    ) {
      return createDefaultLifetimeSummary(playerId);
    }

    return {
      playerId,
      totalPlays: parsed.totalPlays,
      totalClears: parsed.totalClears,
      totalScore: parsed.totalScore,
      bestScore:
        parsed.bestScore === null || isFiniteNumber(parsed.bestScore)
          ? (parsed.bestScore ?? null)
          : null,
      lastPlayedAt:
        parsed.lastPlayedAt === null || isFiniteNumber(parsed.lastPlayedAt)
          ? (parsed.lastPlayedAt ?? null)
          : null,
    };
  } catch {
    return createDefaultLifetimeSummary(playerId);
  }
};

export const saveLifetimeSummary = (
  playerId: string,
  summary: PlayerLifetimeSummary,
) => {
  try {
    localStorage.setItem(
      getLifetimeSummaryStorageKey(playerId),
      JSON.stringify(summary),
    );
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

export const loadStageSummaries = (
  playerId: string,
): StageLifetimeSummary[] => {
  try {
    const raw = localStorage.getItem(getStageSummaryStorageKey(playerId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

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
        isFiniteNumber(summary.totalScore) &&
        summary.totalScore >= 0 &&
        (summary.bestScore === null || isFiniteNumber(summary.bestScore)) &&
        (summary.bestDurationMs === null ||
          isFiniteNumber(summary.bestDurationMs))
      );
    });
  } catch {
    return [];
  }
};

export const saveStageSummaries = (
  playerId: string,
  summaries: StageLifetimeSummary[],
) => {
  try {
    localStorage.setItem(
      getStageSummaryStorageKey(playerId),
      JSON.stringify(summaries),
    );
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};
