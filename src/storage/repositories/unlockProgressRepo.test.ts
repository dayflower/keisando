import { afterEach, describe, expect, it } from "vitest";
import {
  installTestLocalStorage,
  resetTestLocalStorage,
} from "./testLocalStorage";
import {
  loadUnlockedStageIdsByPlayer,
  saveUnlockedStageIdsByPlayer,
} from "./unlockProgressRepo";

afterEach(() => {
  resetTestLocalStorage();
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
    installTestLocalStorage(store);

    expect(loadUnlockedStageIdsByPlayer()).toEqual({
      p1: ["stage2", "stage3"],
    });
  });

  it("saves unlocked-stage entries", () => {
    const store = new Map<string, string>();
    installTestLocalStorage(store);

    saveUnlockedStageIdsByPlayer({ p1: ["stage2"], p2: ["stage2", "stage3"] });

    expect(store.get("keisando:unlocked-stage-ids-by-player:v1")).toBe(
      JSON.stringify({ p1: ["stage2"], p2: ["stage2", "stage3"] }),
    );
  });
});
