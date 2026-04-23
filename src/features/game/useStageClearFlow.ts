import type { Dispatch, SetStateAction } from "react";
import { useCallback, useRef, useState } from "react";
import { STAGES } from "../../shared/stages";
import type { StageClearCondition, StageRunRecord } from "../../shared/types";
import {
  type ClearSoundVariant,
  isNewBestRecord,
  mapClearSoundVariantToCelebration,
} from "./clearCelebration";
import { isStageConditionClear } from "./clearConditions";
import type { StageClearPayload } from "./useGameSession";

type AppendClearRecordInput = {
  playerId: string;
  stageId: string;
  score: number;
  durationMs: number;
  playedAt: number;
  mistakeCount: number;
};

type UseStageClearFlowInput = {
  records: StageRunRecord[];
  unlockedStageIdsByPlayer: Record<string, string[]>;
  setUnlockedStageIdsByPlayer: Dispatch<
    SetStateAction<Record<string, string[]>>
  >;
  addRecord: (record: StageRunRecord) => void;
  appendClearRecord: (input: AppendClearRecordInput) => void;
  stageClearConditionById: Map<string, StageClearCondition>;
};

export type StageClearResolution = {
  clearSoundVariant: ClearSoundVariant;
  didUnlockNextStageOnClear: boolean;
  nextUnlockedStageId: string | null;
};

const sortByRanking = (a: StageRunRecord, b: StageRunRecord): number => {
  if (a.elapsedMs !== b.elapsedMs) {
    return a.elapsedMs - b.elapsedMs;
  }

  return a.recordedAt - b.recordedAt;
};

const findBestRecord = (
  records: StageRunRecord[],
  stageId: string,
  playerId?: string,
): StageRunRecord | null => {
  let best: StageRunRecord | null = null;

  for (const record of records) {
    if (record.stageId !== stageId) {
      continue;
    }
    if (playerId && record.playerId !== playerId) {
      continue;
    }

    if (!best || sortByRanking(record, best) < 0) {
      best = record;
    }
  }

  return best;
};

export const resolveStageClear = (
  payload: StageClearPayload,
  records: StageRunRecord[],
  unlockedStageIdsByPlayer: Record<string, string[]>,
  stageClearConditionById: Map<string, StageClearCondition>,
): StageClearResolution => {
  const currentStageIndex = STAGES.findIndex(
    (stage) => stage.id === payload.stageId,
  );
  const nextStage =
    currentStageIndex >= 0 && currentStageIndex + 1 < STAGES.length
      ? STAGES[currentStageIndex + 1]
      : null;
  const stageCondition = stageClearConditionById.get(payload.stageId);
  const isConditionClear =
    stageCondition === undefined
      ? false
      : isStageConditionClear(
          payload.clearRecord.elapsedMs,
          payload.clearRecord.wrongCount,
          stageCondition,
        );

  const currentUnlockedStageIds =
    unlockedStageIdsByPlayer[payload.playerId] ?? [];
  const didUnlockNextStageOnClear =
    nextStage !== null &&
    isConditionClear &&
    !currentUnlockedStageIds.includes(nextStage.id);

  const globalBest = findBestRecord(records, payload.stageId);
  const myBest = findBestRecord(records, payload.stageId, payload.playerId);
  const isGlobalBestUpdated = isNewBestRecord(payload.clearRecord, globalBest);
  const isMyBestUpdated = isNewBestRecord(payload.clearRecord, myBest);

  let clearSoundVariant: ClearSoundVariant;
  if (isGlobalBestUpdated) {
    clearSoundVariant = "globalBest";
  } else if (isMyBestUpdated) {
    clearSoundVariant = "myBest";
  } else {
    clearSoundVariant =
      payload.mistakeCount === 0 ? "noMistake" : "withMistake";
  }

  return {
    clearSoundVariant,
    didUnlockNextStageOnClear,
    nextUnlockedStageId:
      didUnlockNextStageOnClear && nextStage ? nextStage.id : null,
  };
};

export const useStageClearFlow = ({
  records,
  unlockedStageIdsByPlayer,
  setUnlockedStageIdsByPlayer,
  addRecord,
  appendClearRecord,
  stageClearConditionById,
}: UseStageClearFlowInput) => {
  const clearSoundVariantRef = useRef<ClearSoundVariant>("withMistake");
  const [clearCelebrationTick, setClearCelebrationTick] = useState(0);
  const [didUnlockNextStageOnClear, setDidUnlockNextStageOnClear] =
    useState(false);

  const handleStageClear = useCallback(
    (payload: StageClearPayload) => {
      const resolution = resolveStageClear(
        payload,
        records,
        unlockedStageIdsByPlayer,
        stageClearConditionById,
      );

      if (resolution.nextUnlockedStageId) {
        const nextUnlockedStageId = resolution.nextUnlockedStageId;
        setUnlockedStageIdsByPlayer((prev) => ({
          ...prev,
          [payload.playerId]: [
            ...(prev[payload.playerId] ?? []),
            nextUnlockedStageId,
          ],
        }));
      }

      clearSoundVariantRef.current = resolution.clearSoundVariant;
      setDidUnlockNextStageOnClear(resolution.didUnlockNextStageOnClear);
      setClearCelebrationTick((prev) => prev + 1);

      addRecord(payload.clearRecord);
      appendClearRecord({
        playerId: payload.playerId,
        stageId: payload.stageId,
        score: payload.score,
        durationMs: payload.durationMs,
        playedAt: payload.playedAt,
        mistakeCount: payload.mistakeCount,
      });
    },
    [
      addRecord,
      appendClearRecord,
      records,
      setUnlockedStageIdsByPlayer,
      stageClearConditionById,
      unlockedStageIdsByPlayer,
    ],
  );

  const resetClearFlow = useCallback(() => {
    clearSoundVariantRef.current = "withMistake";
    setClearCelebrationTick(0);
    setDidUnlockNextStageOnClear(false);
  }, []);

  return {
    handleStageClear,
    clearSoundVariant: clearSoundVariantRef.current,
    clearCelebration: mapClearSoundVariantToCelebration(
      clearSoundVariantRef.current,
    ),
    clearCelebrationTick,
    didUnlockNextStageOnClear,
    resetClearFlow,
  };
};
