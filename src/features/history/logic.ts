import { HISTORY_RETENTION_MS } from "../../shared/constants";
import type {
  PlayerLifetimeSummary,
  PlayHistoryRecord,
  StageLifetimeSummary,
} from "../../shared/types";

export const pruneHistoryRecords = (
  records: PlayHistoryRecord[],
  nowMs: number,
): PlayHistoryRecord[] => {
  const cutoff = nowMs - HISTORY_RETENTION_MS + 1;
  return records.filter((record) => record.playedAt >= cutoff);
};

export const updateLifetimeSummary = (
  current: PlayerLifetimeSummary,
  score: number,
  playedAt: number,
): PlayerLifetimeSummary => ({
  ...current,
  totalPlays: current.totalPlays + 1,
  totalClears: current.totalClears + 1,
  totalScore: current.totalScore + score,
  bestScore:
    current.bestScore === null ? score : Math.max(current.bestScore, score),
  lastPlayedAt: playedAt,
});

export const updateStageLifetimeSummaries = (
  current: StageLifetimeSummary[],
  playerId: string,
  stageId: string,
  score: number,
  durationMs: number,
): StageLifetimeSummary[] => {
  const targetIndex = current.findIndex((item) => item.stageId === stageId);
  if (targetIndex === -1) {
    return [
      ...current,
      {
        playerId,
        stageId,
        attempts: 1,
        clears: 1,
        totalScore: score,
        bestScore: score,
        bestDurationMs: durationMs,
      },
    ];
  }

  const target = current[targetIndex];
  const updated: StageLifetimeSummary = {
    ...target,
    attempts: target.attempts + 1,
    clears: target.clears + 1,
    totalScore: target.totalScore + score,
    bestScore:
      target.bestScore === null ? score : Math.max(target.bestScore, score),
    bestDurationMs:
      target.bestDurationMs === null
        ? durationMs
        : Math.min(target.bestDurationMs, durationMs),
  };

  return [
    ...current.slice(0, targetIndex),
    updated,
    ...current.slice(targetIndex + 1),
  ];
};
