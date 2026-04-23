import { describe, expect, it } from "vitest";
import { STAGES } from "../../shared/stages";
import type { StageClearCondition, StageRunRecord } from "../../shared/types";
import type { StageClearPayload } from "./useGameSession";
import { resolveStageClear } from "./useStageClearFlow";

const createRecord = (
  elapsedMs: number,
  recordedAt: number,
  playerId = "player1",
  stageId = "stage1",
): StageRunRecord => ({
  id: `${playerId}-${stageId}-${elapsedMs}-${recordedAt}`,
  stageId,
  playerId,
  elapsedMs,
  requiredCount: 10,
  wrongCount: 0,
  recordedAt,
});

const createPayload = (
  clearRecord: StageRunRecord,
  mistakeCount = clearRecord.wrongCount,
): StageClearPayload => ({
  clearRecord,
  playerId: clearRecord.playerId,
  stageId: clearRecord.stageId,
  score: 500,
  durationMs: clearRecord.elapsedMs,
  mistakeCount,
  playedAt: clearRecord.recordedAt,
});

const createStageClearConditionById = () =>
  new Map<string, StageClearCondition>(
    STAGES.map((stage) => [stage.id, stage.defaultClearCondition]),
  );

describe("resolveStageClear", () => {
  it("marks globalBest when the clear beats the current global best", () => {
    const payload = createPayload(createRecord(1800, 200));
    const result = resolveStageClear(
      payload,
      [createRecord(2000, 100, "player2")],
      {},
      createStageClearConditionById(),
    );

    expect(result.clearSoundVariant).toBe("globalBest");
  });

  it("marks myBest when the clear beats only the player's best", () => {
    const payload = createPayload(createRecord(1900, 300));
    const result = resolveStageClear(
      payload,
      [createRecord(1500, 100, "player2"), createRecord(2200, 200, "player1")],
      {},
      createStageClearConditionById(),
    );

    expect(result.clearSoundVariant).toBe("myBest");
  });

  it("marks noMistake when it is not a best record and has no mistakes", () => {
    const payload = createPayload(createRecord(2100, 300), 0);
    const result = resolveStageClear(
      payload,
      [createRecord(1500, 100, "player2"), createRecord(1800, 200, "player1")],
      {},
      createStageClearConditionById(),
    );

    expect(result.clearSoundVariant).toBe("noMistake");
  });

  it("unlocks the next stage only when the clear condition is satisfied", () => {
    const clearRecord = {
      ...createRecord(2000, 300),
      wrongCount: 0,
    };
    const payload = createPayload(clearRecord, 0);
    const result = resolveStageClear(
      payload,
      [],
      { player1: [] },
      createStageClearConditionById(),
    );

    expect(result.didUnlockNextStageOnClear).toBe(true);
    expect(result.nextUnlockedStageId).toBe("stage2");
  });

  it("does not unlock the next stage when the stage is already unlocked", () => {
    const clearRecord = {
      ...createRecord(2000, 300),
      wrongCount: 0,
    };
    const payload = createPayload(clearRecord, 0);
    const result = resolveStageClear(
      payload,
      [],
      { player1: ["stage2"] },
      createStageClearConditionById(),
    );

    expect(result.didUnlockNextStageOnClear).toBe(false);
    expect(result.nextUnlockedStageId).toBeNull();
  });
});
