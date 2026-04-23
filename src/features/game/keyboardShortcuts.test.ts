import { describe, expect, it } from "vitest";
import {
  getAnswerChoiceIndexByArrowKey,
  getPlayingShortcutAction,
  getStageFocusMoveTarget,
  isStageSelectBlurKey,
} from "./keyboardShortcuts";

describe("getStageFocusMoveTarget", () => {
  it("moves focus backward with ArrowUp/ArrowLeft and wraps", () => {
    expect(getStageFocusMoveTarget(1, "ArrowUp", 3)).toBe(0);
    expect(getStageFocusMoveTarget(1, "ArrowLeft", 3)).toBe(0);
    expect(getStageFocusMoveTarget(0, "ArrowUp", 3)).toBe(2);
  });

  it("moves focus forward with ArrowDown/ArrowRight and wraps", () => {
    expect(getStageFocusMoveTarget(1, "ArrowDown", 3)).toBe(2);
    expect(getStageFocusMoveTarget(1, "ArrowRight", 3)).toBe(2);
    expect(getStageFocusMoveTarget(2, "ArrowDown", 3)).toBe(0);
  });

  it("returns null for unsupported keys or empty stage list", () => {
    expect(getStageFocusMoveTarget(0, "Enter", 3)).toBeNull();
    expect(getStageFocusMoveTarget(0, " ", 3)).toBeNull();
    expect(getStageFocusMoveTarget(0, "ArrowDown", 0)).toBeNull();
  });
});

describe("isStageSelectBlurKey", () => {
  it("returns true only for Escape", () => {
    expect(isStageSelectBlurKey("Escape")).toBe(true);
    expect(isStageSelectBlurKey("Enter")).toBe(false);
    expect(isStageSelectBlurKey("ArrowUp")).toBe(false);
  });
});

describe("getAnswerChoiceIndexByArrowKey", () => {
  it("maps arrow keys to diamond layout indexes", () => {
    expect(getAnswerChoiceIndexByArrowKey("ArrowUp")).toBe(0);
    expect(getAnswerChoiceIndexByArrowKey("ArrowLeft")).toBe(1);
    expect(getAnswerChoiceIndexByArrowKey("ArrowRight")).toBe(2);
    expect(getAnswerChoiceIndexByArrowKey("ArrowDown")).toBe(3);
  });

  it("returns null for non-arrow keys", () => {
    expect(getAnswerChoiceIndexByArrowKey("Enter")).toBeNull();
  });
});

describe("getPlayingShortcutAction", () => {
  it("supports stage-play shortcuts before clear", () => {
    expect(getPlayingShortcutAction("Escape", false)).toBe("back");
    expect(getPlayingShortcutAction("Backspace", false)).toBe("back");
    expect(getPlayingShortcutAction("ArrowUp", false)).toBe("answerTop");
    expect(getPlayingShortcutAction("ArrowLeft", false)).toBe("answerLeft");
    expect(getPlayingShortcutAction("ArrowRight", false)).toBe("answerRight");
    expect(getPlayingShortcutAction("ArrowDown", false)).toBe("answerBottom");
    expect(getPlayingShortcutAction("Enter", false)).toBeNull();
  });

  it("supports clear-screen shortcuts without ArrowLeft back navigation", () => {
    expect(getPlayingShortcutAction("Escape", true)).toBe("back");
    expect(getPlayingShortcutAction("Backspace", true)).toBe("back");
    expect(getPlayingShortcutAction("ArrowLeft", true)).toBeNull();
    expect(getPlayingShortcutAction("Enter", true)).toBe("retry");
    expect(getPlayingShortcutAction(" ", true)).toBe("retry");
    expect(getPlayingShortcutAction("Spacebar", true)).toBe("retry");
    expect(getPlayingShortcutAction("ArrowUp", true)).toBeNull();
  });
});
