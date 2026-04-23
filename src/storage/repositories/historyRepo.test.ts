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

type StorageMap = Map<string, string>;

const installLocalStorage = (store: StorageMap) => {
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });
};

afterEach(() => {
  Reflect.deleteProperty(globalThis, "localStorage");
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
            result: "clear",
            durationMs: 12_000,
            mistakeCount: 1,
            appVersion: "1.0.0",
          },
          {
            id: "h2",
            playerId: "other",
            playedAt: 1_700_000_000_001,
            stageId: "stage1",
            result: "clear",
            durationMs: 13_000,
            mistakeCount: 1,
            appVersion: "1.0.0",
          },
        ]),
      ],
    ]);
    installLocalStorage(store);

    expect(loadPlayerHistory(playerId)).toEqual([
      {
        id: "h1",
        playerId,
        playedAt: 1_700_000_000_000,
        stageId: "stage1",
        result: "clear",
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
    installLocalStorage(store);

    expect(loadPlayerHistory(playerId)).toEqual([]);
    expect(loadLifetimeSummary(playerId)).toEqual(
      createDefaultLifetimeSummary(playerId),
    );
    expect(loadStageSummaries(playerId)).toEqual([]);
  });

  it("saves history data", () => {
    const playerId = "p1";
    const store = new Map<string, string>();
    installLocalStorage(store);

    savePlayerHistory(playerId, [
      {
        id: "h1",
        playerId,
        playedAt: 1_700_000_000_000,
        stageId: "stage1",
        result: "clear",
        durationMs: 12_000,
        mistakeCount: 1,
        appVersion: "1.0.0",
      },
    ]);
    saveLifetimeSummary(playerId, {
      playerId,
      totalPlays: 10,
      totalClears: 8,
      lastPlayedAt: 1_700_000_000_010,
    });
    saveStageSummaries(playerId, [
      {
        playerId,
        stageId: "stage1",
        attempts: 5,
        clears: 4,
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
          result: "clear",
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
        totalClears: 8,
        lastPlayedAt: 1_700_000_000_010,
      }),
    );
    expect(store.get(getStageSummaryStorageKey(playerId))).toBe(
      JSON.stringify([
        {
          playerId,
          stageId: "stage1",
          attempts: 5,
          clears: 4,
          bestDurationMs: 11_000,
        },
      ]),
    );
  });
});
