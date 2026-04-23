import { afterEach, describe, expect, it } from "vitest";
import {
  loadStageClearConditionOverrides,
  saveStageClearConditionOverrides,
} from "./stageClearConditionsRepo";

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

describe("stageClearConditionsRepo", () => {
  it("loads only valid stage condition objects", () => {
    const store = new Map<string, string>([
      [
        "keisando:stage-clear-conditions:v1",
        JSON.stringify({
          stage1: { maxElapsedMs: 12_000, requireNoMistake: true },
          stage2: { maxElapsedMs: 0, requireNoMistake: true },
          stage3: { maxElapsedMs: 11_000, requireNoMistake: "yes" },
        }),
      ],
    ]);
    installLocalStorage(store);

    expect(loadStageClearConditionOverrides()).toEqual({
      stage1: { maxElapsedMs: 12_000, requireNoMistake: true },
    });
  });

  it("saves overrides", () => {
    const store = new Map<string, string>();
    installLocalStorage(store);

    saveStageClearConditionOverrides({
      stage1: { maxElapsedMs: 15_000, requireNoMistake: true },
    });

    expect(store.get("keisando:stage-clear-conditions:v1")).toBe(
      JSON.stringify({
        stage1: { maxElapsedMs: 15_000, requireNoMistake: true },
      }),
    );
  });
});
