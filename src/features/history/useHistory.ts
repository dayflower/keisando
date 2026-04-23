import { useCallback, useEffect, useState } from "react";
import { APP_VERSION } from "../../shared/constants";
import { createRecordId } from "../../shared/ids";
import type {
  PlayerLifetimeSummary,
  PlayHistoryRecord,
  StageLifetimeSummary,
} from "../../shared/types";
import {
  createDefaultLifetimeSummary,
  loadLifetimeSummary,
  loadPlayerHistory,
  loadStageSummaries,
  saveLifetimeSummary,
  savePlayerHistory,
  saveStageSummaries,
} from "../../storage/repositories/historyRepo";
import {
  pruneHistoryRecords,
  updateLifetimeStreak,
  updateLifetimeSummary,
  updateStageLifetimeSummaries,
} from "./logic";

type UseHistoryInput = {
  activePlayerId: string | null;
};

export const useHistory = ({ activePlayerId }: UseHistoryInput) => {
  const [historyRecords, setHistoryRecords] = useState<PlayHistoryRecord[]>([]);
  const [historySummary, setHistorySummary] =
    useState<PlayerLifetimeSummary | null>(null);
  const [stageSummaries, setStageSummaries] = useState<StageLifetimeSummary[]>(
    [],
  );

  useEffect(() => {
    if (!activePlayerId) {
      setHistoryRecords([]);
      setHistorySummary(null);
      setStageSummaries([]);
      return;
    }

    setHistoryRecords(
      loadPlayerHistory(activePlayerId).sort((a, b) => b.playedAt - a.playedAt),
    );
    setHistorySummary(loadLifetimeSummary(activePlayerId));
    setStageSummaries(
      loadStageSummaries(activePlayerId).sort((a, b) =>
        a.stageId.localeCompare(b.stageId),
      ),
    );
  }, [activePlayerId]);

  const getCurrentLifetimeSummary = useCallback(
    (playerId: string) => {
      const storedLifetime = loadLifetimeSummary(playerId);
      return storedLifetime.playerId === playerId
        ? storedLifetime
        : (historySummary ?? createDefaultLifetimeSummary(playerId));
    },
    [historySummary],
  );

  const appendClearRecord = useCallback(
    (args: {
      playerId: string;
      stageId: string;
      durationMs: number;
      playedAt: number;
      mistakeCount: number;
    }) => {
      const { playerId, stageId, durationMs, playedAt, mistakeCount } = args;
      const historyRecord: PlayHistoryRecord = {
        id: createRecordId(),
        playerId,
        playedAt,
        stageId,
        result: "clear",
        durationMs,
        mistakeCount,
        appVersion: APP_VERSION,
      };

      const isActiveHistoryTarget = playerId === activePlayerId;
      const baseHistory = isActiveHistoryTarget
        ? historyRecords
        : loadPlayerHistory(playerId).sort((a, b) => b.playedAt - a.playedAt);
      const nextHistory = pruneHistoryRecords(
        [...baseHistory, historyRecord],
        playedAt,
      ).sort((a, b) => b.playedAt - a.playedAt);
      if (isActiveHistoryTarget) {
        setHistoryRecords(nextHistory);
      }
      savePlayerHistory(playerId, nextHistory);

      const currentLifetime = getCurrentLifetimeSummary(playerId);
      const nextLifetime = updateLifetimeSummary(currentLifetime, playedAt);
      if (isActiveHistoryTarget) {
        setHistorySummary(nextLifetime);
      }
      saveLifetimeSummary(playerId, nextLifetime);

      const currentStageSummaries = isActiveHistoryTarget
        ? stageSummaries
        : loadStageSummaries(playerId);
      const nextStageSummaries = updateStageLifetimeSummaries(
        currentStageSummaries,
        playerId,
        stageId,
        durationMs,
      ).sort((a, b) => a.stageId.localeCompare(b.stageId));
      if (isActiveHistoryTarget) {
        setStageSummaries(nextStageSummaries);
      }
      saveStageSummaries(playerId, nextStageSummaries);
    },
    [activePlayerId, getCurrentLifetimeSummary, historyRecords, stageSummaries],
  );

  const recordAnsweredQuestion = useCallback(
    (args: { playerId: string; isCorrect: boolean }) => {
      const { playerId, isCorrect } = args;
      const isActiveHistoryTarget = playerId === activePlayerId;
      const currentLifetime = getCurrentLifetimeSummary(playerId);
      const nextLifetime = updateLifetimeStreak(currentLifetime, isCorrect);

      if (isActiveHistoryTarget) {
        setHistorySummary(nextLifetime);
      }

      saveLifetimeSummary(playerId, nextLifetime);
    },
    [activePlayerId, getCurrentLifetimeSummary],
  );

  const initializePlayerHistory = useCallback((playerId: string) => {
    saveLifetimeSummary(playerId, createDefaultLifetimeSummary(playerId));
  }, []);

  const resetHistory = useCallback(() => {
    setHistoryRecords([]);
    setHistorySummary(null);
    setStageSummaries([]);
  }, []);

  return {
    historyRecords,
    historySummary,
    stageSummaries,
    appendClearRecord,
    recordAnsweredQuestion,
    initializePlayerHistory,
    resetHistory,
  };
};
