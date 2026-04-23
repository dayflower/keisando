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

  it("includes representative Phase 2 messages for both locales", () => {
    expect(translate("ja", "ranking.globalTop10")).toBe("全体 Top10");
    expect(translate("en", "ranking.globalTop10")).toBe("Global Top10");
    expect(translate("ja", "history.recentHistory")).toBe(
      "最近の履歴 (過去10日)",
    );
    expect(translate("en", "history.recentHistory")).toBe(
      "Recent History (Last 10 Days)",
    );
    expect(translate("ja", "playing.clearTitle")).toBe("ステージクリア!");
    expect(translate("en", "playing.clearTitle")).toBe("Stage Clear!");
  });
});
