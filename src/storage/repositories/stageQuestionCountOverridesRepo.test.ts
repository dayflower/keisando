import { afterEach, describe, expect, it } from "vitest";
import {
  loadStageQuestionCountOverrides,
  saveStageQuestionCountOverrides,
} from "./stageQuestionCountOverridesRepo";
import {
  installTestLocalStorage,
  resetTestLocalStorage,
} from "./testLocalStorage";

afterEach(() => {
  resetTestLocalStorage();
});

describe("stageQuestionCountOverridesRepo", () => {
  it("loads only positive integer question counts", () => {
    const store = new Map<string, string>([
      [
        "keisando:stage-question-counts:v1",
        JSON.stringify({
          stage1: 12,
          stage2: 0,
          stage3: 4.5,
          stage4: "8",
          stage5: 7,
        }),
      ],
    ]);
    installTestLocalStorage(store);

    expect(loadStageQuestionCountOverrides()).toEqual({
      stage1: 12,
      stage5: 7,
    });
  });

  it("saves overrides", () => {
    const store = new Map<string, string>();
    installTestLocalStorage(store);

    saveStageQuestionCountOverrides({
      stage1: 15,
    });

    expect(store.get("keisando:stage-question-counts:v1")).toBe(
      JSON.stringify({
        stage1: 15,
      }),
    );
  });
});
