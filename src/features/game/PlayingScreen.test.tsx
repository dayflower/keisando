import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider, type Locale } from "../../shared/i18n";
import type { PlayingScreenProps } from "./PlayingScreen";
import { PlayingScreen } from "./PlayingScreen";

const buildProps = (
  overrides: Partial<PlayingScreenProps> = {},
): PlayingScreenProps => ({
  selectedStage: {
    id: "stage1",
    baseQuestionCount: 10,
    answerMin: 1,
    answerMax: 20,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      requireNoMistake: true,
    },
    createExpression: () => ({ left: 1, right: 1, operator: "+", answer: 2 }),
  },
  playingPlayer: {
    id: "player1",
    name: "Alice",
    createdAt: 1,
  },
  question: {
    left: 1,
    right: 1,
    operator: "+",
    answer: 2,
    options: [2, 3, 4, 5],
  },
  answeredCount: 10,
  requiredCount: 10,
  currentCombo: 0,
  comboEffectTick: 0,
  comboMilestoneTick: 0,
  comboMilestoneValue: 0,
  comboEffectOrigin: { x: 0, y: 0 },
  remainingCount: 0,
  elapsedMs: 2134,
  bestTimeMs: 2134,
  isCleared: true,
  isRoundActive: false,
  countdownDisplay: 1,
  wrongAnswerCount: 0,
  lastResult: "correct",
  clearCelebrationTier: "normal",
  clearBestBadge: "none",
  clearCelebrationTick: 1,
  didUnlockNextStageOnClear: true,
  onAnswer: () => {},
  onBackToStageSelect: () => {},
  onResetStage: () => {},
  isMuted: false,
  onToggleMute: () => {},
  ...overrides,
});

const renderScreen = (
  props: Partial<PlayingScreenProps> = {},
  locale: Locale = "en",
) => {
  return renderToStaticMarkup(
    <I18nProvider
      locale={locale}
      localeOverride={null}
      setLocaleOverride={() => null}
    >
      <PlayingScreen {...buildProps(props)} />
    </I18nProvider>,
  );
};

describe("PlayingScreen clear celebration", () => {
  it("shows best badge when tier is best", () => {
    const html = renderScreen({
      clearCelebrationTier: "best",
      clearBestBadge: "global",
    });

    expect(html).toContain("clear-celebration-best");
    expect(html).toContain("GLOBAL BEST");
  });

  it("uses noMistake celebration without best badge", () => {
    const html = renderScreen({
      clearCelebrationTier: "noMistake",
      clearBestBadge: "none",
    });

    expect(html).toContain("clear-celebration-noMistake");
    expect(html).not.toContain("clear-best-badge");
    expect(html).not.toContain("clear-burst-shockwave");
    const burstCount =
      html.match(/class="clear-burst(?: [^"]*)?"/g)?.length ?? 0;
    expect(burstCount).toBe(3);
  });

  it("uses normal celebration with one burst", () => {
    const html = renderScreen({
      clearCelebrationTier: "normal",
      clearBestBadge: "none",
    });

    expect(html).toContain("clear-celebration-normal");
    const burstCount =
      html.match(/class="clear-burst(?: [^"]*)?"/g)?.length ?? 0;
    expect(burstCount).toBe(1);
  });

  it("uses my best celebration with shockwave and three bursts", () => {
    const html = renderScreen({
      clearCelebrationTier: "best",
      clearBestBadge: "my",
    });

    const burstCount =
      html.match(/class="clear-burst(?: [^"]*)?"/g)?.length ?? 0;
    expect(burstCount).toBe(3);
    expect(html).toContain("clear-burst-shockwave");
  });

  it("uses global best celebration with shockwave and seven bursts", () => {
    const html = renderScreen({
      clearCelebrationTier: "best",
      clearBestBadge: "global",
    });

    const burstCount =
      html.match(/class="clear-burst(?: [^"]*)?"/g)?.length ?? 0;
    expect(burstCount).toBe(7);
    expect(html).toContain("clear-burst-shockwave");
  });

  it("renders combo burst markup from the shared combo view model", () => {
    const html = renderScreen({
      isCleared: false,
      isRoundActive: true,
      currentCombo: 10,
      comboEffectTick: 2,
      comboMilestoneTick: 3,
      comboMilestoneValue: 10,
      lastResult: "correct",
    });

    expect(html).toContain("combo-effects-active combo-tier-high");
    const particleCount = html.match(/class="combo-particle"/g)?.length ?? 0;
    expect(particleCount).toBe(14);
    expect(html).toContain("10 COMBO!");
  });

  it("renders translated active-round labels", () => {
    const html = renderScreen(
      {
        isCleared: false,
        isRoundActive: true,
        lastResult: null,
        answeredCount: 3,
        requiredCount: 10,
        remainingCount: 7,
      },
      "ja",
    );

    expect(html).toContain("Stage 1 / 足し算 / Alice");
    expect(html).toContain("回答数: 3 / 10");
    expect(html).toContain("残り: 7");
    expect(html).toContain("問題進捗");
    expect(html).toContain("正しい答えを選んで");
  });

  it("renders translated clear-summary labels", () => {
    const html = renderScreen(
      {
        isCleared: true,
        didUnlockNextStageOnClear: true,
        wrongAnswerCount: 2,
        requiredCount: 11,
      },
      "ja",
    );

    expect(html).toContain("ステージクリア!");
    expect(html).toContain("次のステージを解放!");
    expect(html).toContain("クリアタイム");
    expect(html).toContain("最終問題数: 11");
    expect(html).toContain("ミス数: 2");
    expect(html).toContain("戻る");
    expect(html).toContain("リトライ");
  });
});
