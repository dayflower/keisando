import { afterEach, describe, expect, it } from "vitest";
import {
  loadStageClearConditionOverrides,
  saveStageClearConditionOverrides,
} from "./stageClearConditionsRepo";
import {
  installTestLocalStorage,
  resetTestLocalStorage,
} from "./testLocalStorage";

afterEach(() => {
  resetTestLocalStorage();
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
    installTestLocalStorage(store);

    expect(loadStageClearConditionOverrides()).toEqual({
      stage1: { maxElapsedMs: 12_000, requireNoMistake: true },
    });
  });

  it("saves overrides", () => {
    const store = new Map<string, string>();
    installTestLocalStorage(store);

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
