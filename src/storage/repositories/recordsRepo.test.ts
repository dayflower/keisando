import { afterEach, describe, expect, it } from "vitest";
import { RECORDS_STORAGE_KEY } from "../keys";
import { loadRecords, saveRecords } from "./recordsRepo";
import {
  installTestLocalStorage,
  resetTestLocalStorage,
} from "./testLocalStorage";

afterEach(() => {
  resetTestLocalStorage();
});

describe("recordsRepo", () => {
  it("loads only valid records", () => {
    const store = new Map<string, string>([
      [
        RECORDS_STORAGE_KEY,
        JSON.stringify([
          {
            id: "r1",
            stageId: "stage1",
            playerId: "p1",
            elapsedMs: 12_345,
            requiredCount: 10,
            wrongCount: 1,
            recordedAt: 1_700_000_000_000,
          },
          {
            id: "r2",
            stageId: "stage1",
            playerId: "p1",
            elapsedMs: 0,
            requiredCount: 10,
            wrongCount: 1,
            recordedAt: 1_700_000_000_001,
          },
          {
            id: "r3",
            stageId: "stage1",
            playerId: "p1",
            elapsedMs: 15_000,
            requiredCount: 0,
            wrongCount: 1,
            recordedAt: 1_700_000_000_002,
          },
        ]),
      ],
    ]);
    installTestLocalStorage(store);

    expect(loadRecords()).toEqual([
      {
        id: "r1",
        stageId: "stage1",
        playerId: "p1",
        elapsedMs: 12_345,
        requiredCount: 10,
        wrongCount: 1,
        recordedAt: 1_700_000_000_000,
      },
    ]);
  });

  it("falls back to empty records when stored value is invalid", () => {
    const store = new Map<string, string>([
      [RECORDS_STORAGE_KEY, '{"bad":true}'],
    ]);
    installTestLocalStorage(store);

    expect(loadRecords()).toEqual([]);
  });

  it("saves records", () => {
    const store = new Map<string, string>();
    installTestLocalStorage(store);

    saveRecords([
      {
        id: "r1",
        stageId: "stage1",
        playerId: "p1",
        elapsedMs: 12_345,
        requiredCount: 10,
        wrongCount: 1,
        recordedAt: 1_700_000_000_000,
      },
    ]);

    expect(store.get(RECORDS_STORAGE_KEY)).toBe(
      JSON.stringify([
        {
          id: "r1",
          stageId: "stage1",
          playerId: "p1",
          elapsedMs: 12_345,
          requiredCount: 10,
          wrongCount: 1,
          recordedAt: 1_700_000_000_000,
        },
      ]),
    );
  });
});
