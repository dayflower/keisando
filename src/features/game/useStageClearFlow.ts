import type { Dispatch, SetStateAction } from "react";
import { useCallback, useRef, useState } from "react";
import { STAGES } from "../../shared/stages";
import type { StageClearCondition, StageRunRecord } from "../../shared/types";
import { selectBestRecord } from "../ranking/logic";
import {
  type ClearSoundVariant,
  isNewBestRecord,
  mapClearSoundVariantToCelebration,
} from "./clearCelebration";
import { isStageConditionClear } from "./clearConditions";
import type { StageFinishedPayload } from "./useGameSession";

type AppendClearRecordInput = {
  playerId: string;
  stageId: string;
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
  appendPlayRecord: (input: AppendClearRecordInput) => void;
  stageClearConditionById: Map<string, StageClearCondition>;
};

export type StageClearResolution = {
  clearSoundVariant: ClearSoundVariant;
  didUnlockNextStageOnClear: boolean;
  nextUnlockedStageId: string | null;
};

export const resolveStageClear = (
  payload: StageFinishedPayload,
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
          payload.record.elapsedMs,
          payload.record.wrongCount,
          stageCondition,
        );

  const currentUnlockedStageIds =
    unlockedStageIdsByPlayer[payload.playerId] ?? [];
  const didUnlockNextStageOnClear =
    nextStage !== null &&
    isConditionClear &&
    !currentUnlockedStageIds.includes(nextStage.id);

  const globalBest = selectBestRecord(records, payload.stageId);
  const myBest = selectBestRecord(records, payload.stageId, payload.playerId);
  const isGlobalBestUpdated = isNewBestRecord(payload.record, globalBest);
  const isMyBestUpdated = isNewBestRecord(payload.record, myBest);

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
  appendPlayRecord,
  stageClearConditionById,
}: UseStageClearFlowInput) => {
  const clearSoundVariantRef = useRef<ClearSoundVariant>("withMistake");
  const [clearCelebrationTick, setClearCelebrationTick] = useState(0);
  const [didUnlockNextStageOnClear, setDidUnlockNextStageOnClear] =
    useState(false);
  const [hasSeenCurrentClearCelebration, setHasSeenCurrentClearCelebration] =
    useState(false);

  const handleStageFinish = useCallback(
    (payload: StageFinishedPayload) => {
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
      setHasSeenCurrentClearCelebration(false);
      setClearCelebrationTick((prev) => prev + 1);

      addRecord(payload.record);
      appendPlayRecord({
        playerId: payload.playerId,
        stageId: payload.stageId,
        durationMs: payload.durationMs,
        playedAt: payload.playedAt,
        mistakeCount: payload.mistakeCount,
      });
    },
    [
      addRecord,
      appendPlayRecord,
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
    setHasSeenCurrentClearCelebration(false);
  }, []);

  const markCurrentClearCelebrationSeen = useCallback(() => {
    setHasSeenCurrentClearCelebration(true);
  }, []);

  return {
    handleStageFinish,
    clearSoundVariant: clearSoundVariantRef.current,
    clearCelebration: mapClearSoundVariantToCelebration(
      clearSoundVariantRef.current,
    ),
    clearCelebrationTick,
    didUnlockNextStageOnClear,
    hasSeenCurrentClearCelebration,
    markCurrentClearCelebrationSeen,
    resetClearFlow,
  };
};
