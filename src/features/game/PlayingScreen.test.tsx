import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PlayingScreenProps } from "./PlayingScreen";
import {
  getAnswerByArrowKey,
  getPlayingShortcutAction,
  PlayingScreen,
} from "./PlayingScreen";

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
    expect(html).not.toContain("clear-burst-shockwave");
    const burstCount =
      html.match(/class="clear-burst(?: [^"]*)?"/g)?.length ?? 0;
    expect(burstCount).toBe(3);
  });

  it("uses normal celebration with one burst", () => {
    const html = renderToStaticMarkup(
      <PlayingScreen
        {...buildProps({
          clearCelebrationTier: "normal",
          clearBestBadge: "none",
        })}
      />,
    );

    expect(html).toContain("clear-celebration-normal");
    const burstCount =
      html.match(/class="clear-burst(?: [^"]*)?"/g)?.length ?? 0;
    expect(burstCount).toBe(1);
  });

  it("uses my best celebration with shockwave and three bursts", () => {
    const html = renderToStaticMarkup(
      <PlayingScreen
        {...buildProps({
          clearCelebrationTier: "best",
          clearBestBadge: "my",
        })}
      />,
    );

    const burstCount =
      html.match(/class="clear-burst(?: [^"]*)?"/g)?.length ?? 0;
    expect(burstCount).toBe(3);
    expect(html).toContain("clear-burst-shockwave");
  });

  it("uses global best celebration with shockwave and seven bursts", () => {
    const html = renderToStaticMarkup(
      <PlayingScreen
        {...buildProps({
          clearCelebrationTier: "best",
          clearBestBadge: "global",
        })}
      />,
    );

    const burstCount =
      html.match(/class="clear-burst(?: [^"]*)?"/g)?.length ?? 0;
    expect(burstCount).toBe(7);
    expect(html).toContain("clear-burst-shockwave");
  });
});

describe("getAnswerByArrowKey", () => {
  const options = [11, 22, 33, 44];

  it("maps arrow keys to diamond layout options", () => {
    expect(getAnswerByArrowKey("ArrowUp", options)).toBe(11);
    expect(getAnswerByArrowKey("ArrowLeft", options)).toBe(22);
    expect(getAnswerByArrowKey("ArrowRight", options)).toBe(33);
    expect(getAnswerByArrowKey("ArrowDown", options)).toBe(44);
  });

  it("returns null for non-arrow keys", () => {
    expect(getAnswerByArrowKey("Enter", options)).toBeNull();
  });
});

describe("getPlayingShortcutAction", () => {
  it("supports stage-play shortcuts before clear", () => {
    expect(getPlayingShortcutAction("Escape", false)).toBe("back");
    expect(getPlayingShortcutAction("ArrowUp", false)).toBe("answerTop");
    expect(getPlayingShortcutAction("ArrowLeft", false)).toBe("answerLeft");
    expect(getPlayingShortcutAction("ArrowRight", false)).toBe("answerRight");
    expect(getPlayingShortcutAction("ArrowDown", false)).toBe("answerBottom");
    expect(getPlayingShortcutAction("Enter", false)).toBeNull();
  });

  it("supports clear-screen shortcuts", () => {
    expect(getPlayingShortcutAction("Escape", true)).toBe("back");
    expect(getPlayingShortcutAction("ArrowLeft", true)).toBe("back");
    expect(getPlayingShortcutAction("Enter", true)).toBe("retry");
    expect(getPlayingShortcutAction(" ", true)).toBe("retry");
    expect(getPlayingShortcutAction("Spacebar", true)).toBe("retry");
    expect(getPlayingShortcutAction("ArrowUp", true)).toBeNull();
  });
});
