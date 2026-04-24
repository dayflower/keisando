import { afterEach, describe, expect, it } from "vitest";
import {
  getHistoryStorageKey,
  getLifetimeSummaryStorageKey,
  getStageSummaryStorageKey,
} from "../keys";
import {
  createDefaultLifetimeSummary,
  loadLifetimeSummary,
  loadPlayerHistory,
  loadStageSummaries,
  saveLifetimeSummary,
  savePlayerHistory,
  saveStageSummaries,
} from "./historyRepo";
import {
  installTestLocalStorage,
  resetTestLocalStorage,
} from "./testLocalStorage";

afterEach(() => {
  resetTestLocalStorage();
});

describe("historyRepo", () => {
  it("loads only valid history records", () => {
    const playerId = "p1";
    const store = new Map<string, string>([
      [
        getHistoryStorageKey(playerId),
        JSON.stringify([
          {
            id: "h1",
            playerId,
            playedAt: 1_700_000_000_000,
            stageId: "stage1",
            durationMs: 12_000,
            mistakeCount: 1,
            appVersion: "1.0.0",
          },
          {
            id: "h2",
            playerId: "other",
            playedAt: 1_700_000_000_001,
            stageId: "stage1",
            durationMs: 13_000,
            mistakeCount: 1,
            appVersion: "1.0.0",
          },
        ]),
      ],
    ]);
    installTestLocalStorage(store);

    expect(loadPlayerHistory(playerId)).toEqual([
      {
        id: "h1",
        playerId,
        playedAt: 1_700_000_000_000,
        stageId: "stage1",
        durationMs: 12_000,
        mistakeCount: 1,
        appVersion: "1.0.0",
      },
    ]);
  });

  it("falls back to defaults when stored history data is invalid", () => {
    const playerId = "p1";
    const store = new Map<string, string>([
      [getHistoryStorageKey(playerId), '{"bad":true}'],
      [getLifetimeSummaryStorageKey(playerId), "[]"],
      [getStageSummaryStorageKey(playerId), '{"bad":true}'],
    ]);
    installTestLocalStorage(store);

    expect(loadPlayerHistory(playerId)).toEqual([]);
    expect(loadLifetimeSummary(playerId)).toEqual(
      createDefaultLifetimeSummary(playerId),
    );
    expect(loadStageSummaries(playerId)).toEqual([]);
  });

  it("fills missing streak fields from legacy lifetime summaries", () => {
    const playerId = "p1";
    const store = new Map<string, string>([
      [
        getLifetimeSummaryStorageKey(playerId),
        JSON.stringify({
          playerId,
          totalPlays: 10,
          lastPlayedAt: 1_700_000_000_010,
        }),
      ],
    ]);
    installTestLocalStorage(store);

    expect(loadLifetimeSummary(playerId)).toEqual({
      playerId,
      totalPlays: 10,
      lastPlayedAt: 1_700_000_000_010,
      currentCorrectStreak: 0,
      bestCorrectStreak: 0,
    });
  });

  it("falls back to defaults when stored streak values are invalid", () => {
    const playerId = "p1";
    const store = new Map<string, string>([
      [
        getLifetimeSummaryStorageKey(playerId),
        JSON.stringify({
          playerId,
          totalPlays: 10,
          lastPlayedAt: 1_700_000_000_010,
          currentCorrectStreak: -1,
          bestCorrectStreak: 4,
        }),
      ],
    ]);
    installTestLocalStorage(store);

    expect(loadLifetimeSummary(playerId)).toEqual(
      createDefaultLifetimeSummary(playerId),
    );
  });

  it("saves history data", () => {
    const playerId = "p1";
    const store = new Map<string, string>();
    installTestLocalStorage(store);

    savePlayerHistory(playerId, [
      {
        id: "h1",
        playerId,
        playedAt: 1_700_000_000_000,
        stageId: "stage1",
        durationMs: 12_000,
        mistakeCount: 1,
        appVersion: "1.0.0",
      },
    ]);
    saveLifetimeSummary(playerId, {
      playerId,
      totalPlays: 10,
      lastPlayedAt: 1_700_000_000_010,
      currentCorrectStreak: 3,
      bestCorrectStreak: 7,
    });
    saveStageSummaries(playerId, [
      {
        playerId,
        stageId: "stage1",
        attempts: 5,
        bestDurationMs: 11_000,
      },
    ]);

    expect(store.get(getHistoryStorageKey(playerId))).toBe(
      JSON.stringify([
        {
          id: "h1",
          playerId,
          playedAt: 1_700_000_000_000,
          stageId: "stage1",
          durationMs: 12_000,
          mistakeCount: 1,
          appVersion: "1.0.0",
        },
      ]),
    );
    expect(store.get(getLifetimeSummaryStorageKey(playerId))).toBe(
      JSON.stringify({
        playerId,
        totalPlays: 10,
        lastPlayedAt: 1_700_000_000_010,
        currentCorrectStreak: 3,
        bestCorrectStreak: 7,
      }),
    );
    expect(store.get(getStageSummaryStorageKey(playerId))).toBe(
      JSON.stringify([
        {
          playerId,
          stageId: "stage1",
          attempts: 5,
          bestDurationMs: 11_000,
        },
      ]),
    );
  });
});
