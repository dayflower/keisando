import { afterEach, describe, expect, it } from "vitest";
import {
  loadUnlockedStageIdsByPlayer,
  saveUnlockedStageIdsByPlayer,
} from "./unlockProgressRepo";

type StorageMap = Map<string, string>;

const installLocalStorage = (store: StorageMap) => {
  const localStorageMock = {
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
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

describe("unlockProgressRepo", () => {
  it("loads only valid unlocked-stage entries", () => {
    const store = new Map<string, string>([
      [
        "keisando:unlocked-stage-ids-by-player:v1",
        JSON.stringify({
          p1: ["stage2", "stage2", "stage3"],
          p2: "bad",
          p3: [1, 2],
        }),
      ],
    ]);
    installLocalStorage(store);

    expect(loadUnlockedStageIdsByPlayer()).toEqual({
      p1: ["stage2", "stage3"],
    });
  });

  it("saves unlocked-stage entries", () => {
    const store = new Map<string, string>();
    installLocalStorage(store);

    saveUnlockedStageIdsByPlayer({ p1: ["stage2"], p2: ["stage2", "stage3"] });

    expect(store.get("keisando:unlocked-stage-ids-by-player:v1")).toBe(
      JSON.stringify({ p1: ["stage2"], p2: ["stage2", "stage3"] }),
    );
  });
});
