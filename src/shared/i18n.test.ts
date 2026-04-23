import { describe, expect, it } from "vitest";
import { detectLocaleFromNavigator, normalizeLocale, translate } from "./i18n";

describe("normalizeLocale", () => {
  it("normalizes Japanese locales to ja", () => {
    expect(normalizeLocale("ja")).toBe("ja");
    expect(normalizeLocale("ja-JP")).toBe("ja");
  });

  it("falls back to en for non-Japanese locales", () => {
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("fr-FR")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
  });
});

describe("detectLocaleFromNavigator", () => {
  it("prefers navigator.languages over navigator.language", () => {
    expect(detectLocaleFromNavigator(["ja-JP", "en-US"], "en-US")).toBe("ja");
  });

  it("uses navigator.language when languages is empty", () => {
    expect(detectLocaleFromNavigator([], "ja-JP")).toBe("ja");
  });
});

describe("translate", () => {
  it("returns locale-specific messages", () => {
    expect(translate("ja", "stageSelect.screenTag")).toBe("ステージ選択");
    expect(translate("en", "stageSelect.screenTag")).toBe("Select Stage");
  });
});
