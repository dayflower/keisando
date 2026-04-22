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

  const appendClearRecord = useCallback(
    (args: {
      playerId: string;
      stageId: string;
      score: number;
      durationMs: number;
      playedAt: number;
      mistakeCount: number;
    }) => {
      const { playerId, stageId, score, durationMs, playedAt, mistakeCount } =
        args;
      const historyRecord: PlayHistoryRecord = {
        id: createRecordId(),
        playerId,
        playedAt,
        stageId,
        result: "clear",
        score,
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

      const currentLifetime = isActiveHistoryTarget
        ? (historySummary ?? createDefaultLifetimeSummary(playerId))
        : loadLifetimeSummary(playerId);
      const nextLifetime = updateLifetimeSummary(
        currentLifetime,
        score,
        playedAt,
      );
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
        score,
        durationMs,
      ).sort((a, b) => a.stageId.localeCompare(b.stageId));
      if (isActiveHistoryTarget) {
        setStageSummaries(nextStageSummaries);
      }
      saveStageSummaries(playerId, nextStageSummaries);
    },
    [activePlayerId, historyRecords, historySummary, stageSummaries],
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
    initializePlayerHistory,
    resetHistory,
  };
};
