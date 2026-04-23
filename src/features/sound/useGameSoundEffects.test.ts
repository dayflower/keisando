import { describe, expect, it } from "vitest";
import { getGameSoundCommands } from "./useGameSoundEffects";

describe("getGameSoundCommands", () => {
  it("starts bgm only while a round is actively playing", () => {
    const result = getGameSoundCommands(
      "playing",
      {
        isPlaying: true,
        isRoundActive: true,
        isCleared: false,
        countdownDisplay: 3,
        answeredCount: 0,
        lastResult: null,
      },
      {
        countdownDisplay: null,
        isRoundActive: false,
        answeredCount: 0,
        isCleared: false,
        shouldPlayBgm: false,
      },
      "withMistake",
    );

    expect(result.commands).toContainEqual({ type: "startBgm" });
  });

  it("does not restart bgm while the round stays active", () => {
    const result = getGameSoundCommands(
      "playing",
      {
        isPlaying: true,
        isRoundActive: true,
        isCleared: false,
        countdownDisplay: 3,
        answeredCount: 4,
        lastResult: null,
      },
      {
        countdownDisplay: null,
        isRoundActive: true,
        answeredCount: 4,
        isCleared: false,
        shouldPlayBgm: true,
      },
      "withMistake",
    );

    expect(result.commands).not.toContainEqual({ type: "startBgm" });
    expect(result.commands).not.toContainEqual({ type: "stopBgm" });
  });

  it("plays countdown tick only when the countdown number changes", () => {
    const changed = getGameSoundCommands(
      "playing",
      {
        isPlaying: true,
        isRoundActive: false,
        isCleared: false,
        countdownDisplay: 2,
        answeredCount: 0,
        lastResult: null,
      },
      {
        countdownDisplay: 3,
        isRoundActive: false,
        answeredCount: 0,
        isCleared: false,
        shouldPlayBgm: false,
      },
      "withMistake",
    );
    const same = getGameSoundCommands(
      "playing",
      {
        isPlaying: true,
        isRoundActive: false,
        isCleared: false,
        countdownDisplay: 2,
        answeredCount: 0,
        lastResult: null,
      },
      {
        countdownDisplay: 2,
        isRoundActive: false,
        answeredCount: 0,
        isCleared: false,
        shouldPlayBgm: false,
      },
      "withMistake",
    );

    expect(changed.commands).toContainEqual({ type: "playCountdownTick" });
    expect(same.commands).not.toContainEqual({ type: "playCountdownTick" });
  });

  it("plays round start when the round becomes active", () => {
    const result = getGameSoundCommands(
      "playing",
      {
        isPlaying: true,
        isRoundActive: true,
        isCleared: false,
        countdownDisplay: 1,
        answeredCount: 0,
        lastResult: null,
      },
      {
        countdownDisplay: 1,
        isRoundActive: false,
        answeredCount: 0,
        isCleared: false,
        shouldPlayBgm: false,
      },
      "withMistake",
    );

    expect(result.commands).toContainEqual({ type: "playRoundStart" });
  });

  it("switches correct and wrong sounds based on lastResult", () => {
    const correct = getGameSoundCommands(
      "playing",
      {
        isPlaying: true,
        isRoundActive: true,
        isCleared: false,
        countdownDisplay: 1,
        answeredCount: 1,
        lastResult: "correct",
      },
      {
        countdownDisplay: null,
        isRoundActive: true,
        answeredCount: 0,
        isCleared: false,
        shouldPlayBgm: true,
      },
      "withMistake",
    );
    const wrong = getGameSoundCommands(
      "playing",
      {
        isPlaying: true,
        isRoundActive: true,
        isCleared: false,
        countdownDisplay: 1,
        answeredCount: 2,
        lastResult: "wrong",
      },
      {
        countdownDisplay: null,
        isRoundActive: true,
        answeredCount: 1,
        isCleared: false,
        shouldPlayBgm: true,
      },
      "withMistake",
    );

    expect(correct.commands).toContainEqual({ type: "playCorrect" });
    expect(wrong.commands).toContainEqual({ type: "playWrong" });
  });

  it("plays the variant-specific clear sound when clearing a stage", () => {
    const result = getGameSoundCommands(
      "playing",
      {
        isPlaying: true,
        isRoundActive: true,
        isCleared: true,
        countdownDisplay: 1,
        answeredCount: 10,
        lastResult: "correct",
      },
      {
        countdownDisplay: null,
        isRoundActive: true,
        answeredCount: 9,
        isCleared: false,
        shouldPlayBgm: true,
      },
      "globalBest",
    );

    expect(result.commands).toContainEqual({
      type: "playClear",
      variant: "globalBest",
    });
    expect(result.commands).toContainEqual({ type: "stopBgm" });
  });

  it("stops bgm when leaving active play without clearing", () => {
    const result = getGameSoundCommands(
      "stageSelect",
      {
        isPlaying: false,
        isRoundActive: false,
        isCleared: false,
        countdownDisplay: 1,
        answeredCount: 0,
        lastResult: null,
      },
      {
        countdownDisplay: null,
        isRoundActive: true,
        answeredCount: 0,
        isCleared: false,
        shouldPlayBgm: true,
      },
      "withMistake",
    );

    expect(result.commands).toContainEqual({ type: "stopBgm" });
  });
});
