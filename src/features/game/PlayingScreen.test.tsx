import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PlayingScreenProps } from "./PlayingScreen";
import { PlayingScreen } from "./PlayingScreen";

const buildProps = (
  overrides: Partial<PlayingScreenProps> = {},
): PlayingScreenProps => ({
  selectedStage: {
    id: "stage1",
    name: "Stage 1",
    tag: "Addition",
    description: "test",
    baseQuestionCount: 10,
    answerMin: 1,
    answerMax: 20,
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
  onAnswer: () => {},
  onBackToStageSelect: () => {},
  onResetStage: () => {},
  isMuted: false,
  onToggleMute: () => {},
  ...overrides,
});

describe("PlayingScreen clear celebration", () => {
  it("shows best badge when tier is best", () => {
    const html = renderToStaticMarkup(
      <PlayingScreen
        {...buildProps({
          clearCelebrationTier: "best",
          clearBestBadge: "global",
        })}
      />,
    );

    expect(html).toContain("clear-celebration-best");
    expect(html).toContain("GLOBAL BEST");
  });

  it("uses noMistake celebration without best badge", () => {
    const html = renderToStaticMarkup(
      <PlayingScreen
        {...buildProps({
          clearCelebrationTier: "noMistake",
          clearBestBadge: "none",
        })}
      />,
    );

    expect(html).toContain("clear-celebration-noMistake");
    expect(html).not.toContain("clear-best-badge");
  });

  it("uses normal celebration with minimal confetti count", () => {
    const html = renderToStaticMarkup(
      <PlayingScreen
        {...buildProps({
          clearCelebrationTier: "normal",
          clearBestBadge: "none",
        })}
      />,
    );

    expect(html).toContain("clear-celebration-normal");
    const confettiCount = html.match(/clear-confetti/g)?.length ?? 0;
    expect(confettiCount).toBe(8);
  });
});
