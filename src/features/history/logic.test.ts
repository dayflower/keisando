import { describe, expect, it } from "vitest";
import type {
  PlayerLifetimeSummary,
  StageLifetimeSummary,
} from "../../shared/types";
import { updateLifetimeSummary, updateStageLifetimeSummaries } from "./logic";

describe("updateLifetimeSummary", () => {
  it("increments counters and updates best score", () => {
    const current: PlayerLifetimeSummary = {
      playerId: "p1",
      totalPlays: 3,
      totalClears: 2,
      totalScore: 1500,
      bestScore: 900,
      lastPlayedAt: 1000,
    };

    expect(updateLifetimeSummary(current, 1200, 2000)).toEqual({
      playerId: "p1",
      totalPlays: 4,
      totalClears: 3,
      totalScore: 2700,
      bestScore: 1200,
      lastPlayedAt: 2000,
    });
  });
});

describe("updateStageLifetimeSummaries", () => {
  it("creates a new summary when stage does not exist", () => {
    const next = updateStageLifetimeSummaries([], "p1", "s1", 800, 3500);

    expect(next).toEqual([
      {
        playerId: "p1",
        stageId: "s1",
        attempts: 1,
        clears: 1,
        totalScore: 800,
        bestScore: 800,
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
        clears: 2,
        totalScore: 1500,
        bestScore: 900,
        bestDurationMs: 3000,
      },
      {
        playerId: "p1",
        stageId: "s2",
        attempts: 1,
        clears: 1,
        totalScore: 600,
        bestScore: 600,
        bestDurationMs: 4000,
      },
    ];

    const next = updateStageLifetimeSummaries(current, "p1", "s1", 700, 3200);

    expect(next).toEqual([
      {
        playerId: "p1",
        stageId: "s1",
        attempts: 3,
        clears: 3,
        totalScore: 2200,
        bestScore: 900,
        bestDurationMs: 3000,
      },
      {
        playerId: "p1",
        stageId: "s2",
        attempts: 1,
        clears: 1,
        totalScore: 600,
        bestScore: 600,
        bestDurationMs: 4000,
      },
    ]);
  });
});
