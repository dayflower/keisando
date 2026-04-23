import { describe, expect, it } from "vitest";
import type { Screen } from "../../shared/types";
import {
  isBackNavigationShortcutKey,
  isEditableBackspaceTarget,
  supportsBackNavigationShortcut,
} from "./useBackNavigationShortcut";

describe("supportsBackNavigationShortcut", () => {
  it("returns true only for non-playing screens with a back action", () => {
    expect(supportsBackNavigationShortcut("playerSelect")).toBe(true);
    expect(supportsBackNavigationShortcut("historyDetail")).toBe(true);
    expect(supportsBackNavigationShortcut("ranking")).toBe(true);
    expect(supportsBackNavigationShortcut("debug")).toBe(true);

    const unsupportedScreens: Screen[] = ["stageSelect", "playing"];
    for (const screen of unsupportedScreens) {
      expect(supportsBackNavigationShortcut(screen)).toBe(false);
    }
  });
});

describe("isBackNavigationShortcutKey", () => {
  it("supports Escape and Backspace", () => {
    expect(isBackNavigationShortcutKey("Escape")).toBe(true);
    expect(isBackNavigationShortcutKey("Esc")).toBe(true);
    expect(isBackNavigationShortcutKey("Backspace")).toBe(true);
    expect(isBackNavigationShortcutKey("Enter")).toBe(false);
  });
});

describe("isEditableBackspaceTarget", () => {
  it("returns true for editable form controls", () => {
    expect(isEditableBackspaceTarget({ tagName: "input" } as EventTarget)).toBe(
      true,
    );
    expect(
      isEditableBackspaceTarget({ tagName: "textarea" } as EventTarget),
    ).toBe(true);
    expect(
      isEditableBackspaceTarget({ tagName: "select" } as EventTarget),
    ).toBe(true);
  });

  it("returns true for contenteditable elements", () => {
    expect(
      isEditableBackspaceTarget({ isContentEditable: true } as EventTarget),
    ).toBe(true);
  });

  it("returns false for non-editable targets", () => {
    expect(
      isEditableBackspaceTarget({ tagName: "button" } as EventTarget),
    ).toBe(false);
    expect(isEditableBackspaceTarget(null)).toBe(false);
  });
});
