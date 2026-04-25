import { HISTORY_RETENTION_MS } from "../../shared/constants";
import { STAGES } from "../../shared/stages";
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
  playedAt: number,
): PlayerLifetimeSummary => ({
  ...current,
  totalPlays: current.totalPlays + 1,
  lastPlayedAt: playedAt,
});

export const updateLifetimeStreak = (
  current: PlayerLifetimeSummary,
  isCorrect: boolean,
): PlayerLifetimeSummary => {
  if (!isCorrect) {
    return {
      ...current,
      currentCorrectStreak: 0,
    };
  }

  const nextCurrentCorrectStreak = current.currentCorrectStreak + 1;

  return {
    ...current,
    currentCorrectStreak: nextCurrentCorrectStreak,
    bestCorrectStreak: Math.max(
      current.bestCorrectStreak,
      nextCurrentCorrectStreak,
    ),
  };
};

export const updateStageLifetimeSummaries = (
  current: StageLifetimeSummary[],
  playerId: string,
  stageId: string,
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
        bestDurationMs: durationMs,
      },
    ];
  }

  const target = current[targetIndex];
  const updated: StageLifetimeSummary = {
    ...target,
    attempts: target.attempts + 1,
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

export const buildCompleteStageLifetimeSummaries = (
  stageSummaries: StageLifetimeSummary[],
  playerId: string,
): StageLifetimeSummary[] => {
  const stageSummaryMap = new Map(
    stageSummaries.map((summary) => [summary.stageId, summary]),
  );

  return STAGES.map(
    (stage): StageLifetimeSummary =>
      stageSummaryMap.get(stage.id) ?? {
        playerId,
        stageId: stage.id,
        attempts: 0,
        bestDurationMs: null,
      },
  );
};
