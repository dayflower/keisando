import { afterEach, describe, expect, it } from "vitest";
import { RECORDS_STORAGE_KEY } from "../keys";
import { loadRecords, saveRecords } from "./recordsRepo";

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
    installLocalStorage(store);

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
    installLocalStorage(store);

    expect(loadRecords()).toEqual([]);
  });

  it("saves records", () => {
    const store = new Map<string, string>();
    installLocalStorage(store);

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
