import { describe, expect, it } from "vitest";
import type {
  PlayerLifetimeSummary,
  StageLifetimeSummary,
} from "../../shared/types";
import {
  buildCompleteStageLifetimeSummaries,
  updateLifetimeStreak,
  updateLifetimeSummary,
  updateStageLifetimeSummaries,
} from "./logic";

describe("updateLifetimeSummary", () => {
  it("increments counters and updates last played time", () => {
    const current: PlayerLifetimeSummary = {
      playerId: "p1",
      totalPlays: 3,
      lastPlayedAt: 1000,
      currentCorrectStreak: 4,
      bestCorrectStreak: 7,
    };

    expect(updateLifetimeSummary(current, 2000)).toEqual({
      playerId: "p1",
      totalPlays: 4,
      lastPlayedAt: 2000,
      currentCorrectStreak: 4,
      bestCorrectStreak: 7,
    });
  });
});

describe("updateLifetimeStreak", () => {
  it("increments current and best streaks after a correct answer", () => {
    const current: PlayerLifetimeSummary = {
      playerId: "p1",
      totalPlays: 3,
      lastPlayedAt: 1000,
      currentCorrectStreak: 4,
      bestCorrectStreak: 4,
    };

    expect(updateLifetimeStreak(current, true)).toEqual({
      playerId: "p1",
      totalPlays: 3,
      lastPlayedAt: 1000,
      currentCorrectStreak: 5,
      bestCorrectStreak: 5,
    });
  });

  it("resets only the current streak after a wrong answer", () => {
    const current: PlayerLifetimeSummary = {
      playerId: "p1",
      totalPlays: 3,
      lastPlayedAt: 1000,
      currentCorrectStreak: 4,
      bestCorrectStreak: 7,
    };

    expect(updateLifetimeStreak(current, false)).toEqual({
      playerId: "p1",
      totalPlays: 3,
      lastPlayedAt: 1000,
      currentCorrectStreak: 0,
      bestCorrectStreak: 7,
    });
  });
});

describe("updateStageLifetimeSummaries", () => {
  it("creates a new summary when stage does not exist", () => {
    const next = updateStageLifetimeSummaries([], "p1", "s1", 3500);

    expect(next).toEqual([
      {
        playerId: "p1",
        stageId: "s1",
        attempts: 1,
        bestDurationMs: 3500,
      },
    ]);
  });

  it("updates existing stage summary and keeps best values", () => {
    const current: StageLifetimeSummary[] = [
      {
        playerId: "p1",
        stageId: "s1",
        attempts: 2,
        bestDurationMs: 3000,
      },
      {
        playerId: "p1",
        stageId: "s2",
        attempts: 1,
        bestDurationMs: 4000,
      },
    ];

    const next = updateStageLifetimeSummaries(current, "p1", "s1", 3200);

    expect(next).toEqual([
      {
        playerId: "p1",
        stageId: "s1",
        attempts: 3,
        bestDurationMs: 3000,
      },
      {
        playerId: "p1",
        stageId: "s2",
        attempts: 1,
        bestDurationMs: 4000,
      },
    ]);
  });
});

describe("buildCompleteStageLifetimeSummaries", () => {
  it("fills missing stages with empty summaries in stage order", () => {
    const current: StageLifetimeSummary[] = [
      {
        playerId: "p1",
        stageId: "stage2",
        attempts: 3,
        bestDurationMs: 2800,
      },
      {
        playerId: "p1",
        stageId: "stage5",
        attempts: 1,
        bestDurationMs: 5100,
      },
    ];

    const next = buildCompleteStageLifetimeSummaries(current, "p1");

    expect(next).toHaveLength(9);
    expect(next[0]).toEqual({
      playerId: "p1",
      stageId: "stage1",
      attempts: 0,
      bestDurationMs: null,
    });
    expect(next[1]).toEqual(current[0]);
    expect(next[4]).toEqual(current[1]);
    expect(next[8]).toEqual({
      playerId: "p1",
      stageId: "stage9",
      attempts: 0,
      bestDurationMs: null,
    });
  });
});
