import { describe, expect, it } from "vitest";
import {
  detectLocaleFromNavigator,
  getStageDescription,
  getStageLabel,
  getStageName,
  getStageTag,
  normalizeLocale,
  translate,
} from "./i18n";

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

describe("stage helpers", () => {
  it("returns locale-specific stage text", () => {
    expect(getStageName("ja", "stage1")).toBe("Stage 1");
    expect(getStageTag("ja", "stage1")).toBe("足し算");
    expect(getStageDescription("ja", "stage2")).toBe(
      "1桁どうしの引き算 (0-9 - 0-9)",
    );
    expect(getStageTag("en", "stage3")).toBe("Subtraction+");
    expect(getStageLabel("en", "stage2")).toBe("Stage 2");
  });

  it("falls back to the raw stage id for unknown stages", () => {
    expect(getStageName("ja", "stageX")).toBe("stageX");
    expect(getStageTag("en", "stageX")).toBe("stageX");
    expect(getStageDescription("ja", "stageX")).toBe("stageX");
    expect(getStageLabel("en", "stageX")).toBe("stageX");
  });
});
