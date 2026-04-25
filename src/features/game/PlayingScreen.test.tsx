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
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
    },
    createExpression: () => ({ left: 1, right: 1, operator: "+", answer: 2 }),
    createOptions: () => [
      { label: "2", isCorrect: true },
      { label: "3", isCorrect: false },
      { label: "4", isCorrect: false },
      { label: "5", isCorrect: false },
    ],
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
    prompt: "1 + 1 = ?",
    options: [
      { label: "2", isCorrect: true },
      { label: "3", isCorrect: false },
      { label: "4", isCorrect: false },
      { label: "5", isCorrect: false },
    ],
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
  canAdvanceToNextStage: true,
  onAnswer: () => {},
  onBackToStageSelect: () => {},
  onResetStage: () => {},
  onStartNextStage: () => {},
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
        requiredCount: 20,
        remainingCount: 17,
      },
      "ja",
    );

    expect(html).toContain("Stage 1 / 足し算 / Alice");
    expect(html).toContain("残り: 17 / 20");
    expect(html).not.toContain("回答数:");
    expect(html).toContain("問題進捗");
    expect(html).toContain(
      'class="progress-bar-count" aria-hidden="true">3</span>',
    );
    expect(html).toContain("1 + 1 = ?");
    expect(html).toContain('class="result-text"');
    expect(html).not.toContain("正しい答えを選んで");
  });

  it("shows wrong-answer count during an active round only when it is positive", () => {
    const withMistakes = renderScreen(
      {
        isCleared: false,
        isRoundActive: true,
        wrongAnswerCount: 2,
      },
      "ja",
    );
    const withoutMistakes = renderScreen(
      {
        isCleared: false,
        isRoundActive: true,
        wrongAnswerCount: 0,
      },
      "ja",
    );

    expect(withMistakes).toContain("ミス: 2");
    expect(withMistakes.indexOf("残り: 0 / 10")).toBeLessThan(
      withMistakes.indexOf("ミス: 2"),
    );
    expect(withoutMistakes).not.toContain("ミス:");
  });

  it("renders the correct result feedback during an active round", () => {
    const html = renderScreen(
      {
        isCleared: false,
        isRoundActive: true,
        lastResult: "correct",
      },
      "ja",
    );

    expect(html).toContain("result-text result-text-active result-correct");
    expect(html).toContain("正解!");
  });

  it("renders the wrong result feedback during an active round", () => {
    const html = renderScreen(
      {
        isCleared: false,
        isRoundActive: true,
        lastResult: "wrong",
      },
      "ja",
    );

    expect(html).toContain("result-text result-text-active result-wrong");
    expect(html).toContain("不正解! +1問");
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
    expect(html).toContain("ミス: 2");
    expect(html).toContain("次のステージ");
    expect(html).toContain("戻る");
    expect(html).toContain("リトライ");
  });

  it("hides next stage action when no next stage is available", () => {
    const html = renderScreen({
      canAdvanceToNextStage: false,
    });

    expect(html).not.toContain("Next Stage");
  });
});
