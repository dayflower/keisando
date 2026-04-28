import { describe, expect, it } from "vitest";
import { getRankingBackLabelKey, getRankingBackScreen } from "./navigation";

describe("ranking navigation helpers", () => {
  it("returns the stage select destination for stage-select ranking", () => {
    expect(getRankingBackScreen("stageSelect")).toBe("stageSelect");
    expect(getRankingBackLabelKey("stageSelect")).toBe(
      "common.backToStageSelect",
    );
  });

  it("returns the cleared playing screen destination for clear ranking", () => {
    expect(getRankingBackScreen("playingClear")).toBe("playing");
    expect(getRankingBackLabelKey("playingClear")).toBe("common.back");
  });
});
