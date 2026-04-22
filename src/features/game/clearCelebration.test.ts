import { describe, expect, it } from "vitest";
import type { StageRunRecord } from "../../shared/types";
import {
  isNewBestRecord,
  mapClearSoundVariantToCelebration,
} from "./clearCelebration";

const createRecord = (
  elapsedMs: number,
  recordedAt: number,
): StageRunRecord => ({
  id: `${elapsedMs}-${recordedAt}`,
  stageId: "stage1",
  playerId: "player1",
  elapsedMs,
  requiredCount: 10,
  wrongCount: 0,
  recordedAt,
});

describe("mapClearSoundVariantToCelebration", () => {
  it("maps global best to best tier with global badge", () => {
    expect(mapClearSoundVariantToCelebration("globalBest")).toEqual({
      clearCelebrationTier: "best",
      clearBestBadge: "global",
    });
  });

  it("maps my best to best tier with my badge", () => {
    expect(mapClearSoundVariantToCelebration("myBest")).toEqual({
      clearCelebrationTier: "best",
      clearBestBadge: "my",
    });
  });

  it("maps no mistake to noMistake tier without badge", () => {
    expect(mapClearSoundVariantToCelebration("noMistake")).toEqual({
      clearCelebrationTier: "noMistake",
      clearBestBadge: "none",
    });
  });

  it("maps with mistake to normal tier without badge", () => {
    expect(mapClearSoundVariantToCelebration("withMistake")).toEqual({
      clearCelebrationTier: "normal",
      clearBestBadge: "none",
    });
  });
});

describe("isNewBestRecord", () => {
  it("returns true when there is no previous best", () => {
    expect(isNewBestRecord(createRecord(2100, 100), null)).toBe(true);
  });

  it("returns true when elapsed time is shorter", () => {
    expect(
      isNewBestRecord(createRecord(1900, 200), createRecord(2100, 100)),
    ).toBe(true);
  });

  it("returns true when elapsed is tied and timestamp is earlier", () => {
    expect(
      isNewBestRecord(createRecord(2000, 90), createRecord(2000, 100)),
    ).toBe(true);
  });

  it("returns false when elapsed is longer", () => {
    expect(
      isNewBestRecord(createRecord(2200, 90), createRecord(2000, 100)),
    ).toBe(false);
  });
});
