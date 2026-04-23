import { useEffect, useRef } from "react";
import type { Screen } from "../../shared/types";
import type { ClearSoundVariant } from "../game/clearCelebration";
import type { useSoundEffects } from "./useSoundEffects";

type GameSoundState = {
  isPlaying: boolean;
  isRoundActive: boolean;
  isCleared: boolean;
  countdownDisplay: number;
  answeredCount: number;
  lastResult: "correct" | "wrong" | null;
};

type PreviousGameSoundState = {
  countdownDisplay: number | null;
  isRoundActive: boolean;
  answeredCount: number;
  isCleared: boolean;
  shouldPlayBgm: boolean;
};

type GameSoundCommand =
  | { type: "startBgm" }
  | { type: "stopBgm" }
  | { type: "playCountdownTick" }
  | { type: "playRoundStart" }
  | { type: "playCorrect" }
  | { type: "playWrong" }
  | { type: "playClear"; variant: ClearSoundVariant };

type SoundEffectsApi = ReturnType<typeof useSoundEffects>;

const INITIAL_PREVIOUS_STATE: PreviousGameSoundState = {
  countdownDisplay: null,
  isRoundActive: false,
  answeredCount: 0,
  isCleared: false,
  shouldPlayBgm: false,
};

export const getGameSoundCommands = (
  screen: Screen,
  game: Pick<
    GameSoundState,
    | "isPlaying"
    | "isRoundActive"
    | "isCleared"
    | "countdownDisplay"
    | "answeredCount"
    | "lastResult"
  >,
  previous: PreviousGameSoundState,
  clearSoundVariant: ClearSoundVariant,
): {
  commands: GameSoundCommand[];
  nextPrevious: PreviousGameSoundState;
} => {
  const commands: GameSoundCommand[] = [];
  const shouldPlayBgm =
    screen === "playing" &&
    game.isPlaying &&
    game.isRoundActive &&
    !game.isCleared;

  if (shouldPlayBgm !== previous.shouldPlayBgm) {
    commands.push({ type: shouldPlayBgm ? "startBgm" : "stopBgm" });
  }

  let nextCountdownDisplay: number | null = null;
  if (
    screen === "playing" &&
    game.isPlaying &&
    !game.isCleared &&
    !game.isRoundActive
  ) {
    nextCountdownDisplay = game.countdownDisplay;
    if (previous.countdownDisplay !== game.countdownDisplay) {
      commands.push({ type: "playCountdownTick" });
    }
  }

  if (
    screen === "playing" &&
    game.isPlaying &&
    !game.isCleared &&
    !previous.isRoundActive &&
    game.isRoundActive
  ) {
    commands.push({ type: "playRoundStart" });
  }

  if (
    screen === "playing" &&
    game.isPlaying &&
    game.lastResult !== null &&
    game.answeredCount !== previous.answeredCount
  ) {
    commands.push({
      type: game.lastResult === "correct" ? "playCorrect" : "playWrong",
    });
  }

  if (
    screen === "playing" &&
    game.isPlaying &&
    game.isCleared &&
    !previous.isCleared
  ) {
    commands.push({ type: "playClear", variant: clearSoundVariant });
  }

  return {
    commands,
    nextPrevious: {
      countdownDisplay: nextCountdownDisplay,
      isRoundActive: game.isRoundActive,
      answeredCount: game.answeredCount,
      isCleared: game.isCleared,
      shouldPlayBgm,
    },
  };
};

const runGameSoundCommand = (
  command: GameSoundCommand,
  soundEffects: Pick<
    SoundEffectsApi,
    | "startBgm"
    | "stopBgm"
    | "playCountdownTick"
    | "playRoundStart"
    | "playCorrect"
    | "playWrong"
    | "playClearGlobalBest"
    | "playClearMyBest"
    | "playClearNoMistake"
    | "playClearWithMistake"
  >,
) => {
  switch (command.type) {
    case "startBgm":
      soundEffects.startBgm();
      return;
    case "stopBgm":
      soundEffects.stopBgm();
      return;
    case "playCountdownTick":
      soundEffects.playCountdownTick();
      return;
    case "playRoundStart":
      soundEffects.playRoundStart();
      return;
    case "playCorrect":
      soundEffects.playCorrect();
      return;
    case "playWrong":
      soundEffects.playWrong();
      return;
    case "playClear":
      switch (command.variant) {
        case "globalBest":
          soundEffects.playClearGlobalBest();
          return;
        case "myBest":
          soundEffects.playClearMyBest();
          return;
        case "noMistake":
          soundEffects.playClearNoMistake();
          return;
        default:
          soundEffects.playClearWithMistake();
      }
  }
};

export const useGameSoundEffects = ({
  screen,
  game,
  clearSoundVariant,
  soundEffects,
}: {
  screen: Screen;
  game: Pick<
    GameSoundState,
    | "isPlaying"
    | "isRoundActive"
    | "isCleared"
    | "countdownDisplay"
    | "answeredCount"
    | "lastResult"
  >;
  clearSoundVariant: ClearSoundVariant;
  soundEffects: Pick<
    SoundEffectsApi,
    | "startBgm"
    | "stopBgm"
    | "playCountdownTick"
    | "playRoundStart"
    | "playCorrect"
    | "playWrong"
    | "playClearGlobalBest"
    | "playClearMyBest"
    | "playClearNoMistake"
    | "playClearWithMistake"
  >;
}) => {
  const previousRef = useRef<PreviousGameSoundState>(INITIAL_PREVIOUS_STATE);
  const {
    isPlaying,
    isRoundActive,
    isCleared,
    countdownDisplay,
    answeredCount,
    lastResult,
  } = game;

  useEffect(() => {
    const { commands, nextPrevious } = getGameSoundCommands(
      screen,
      {
        isPlaying,
        isRoundActive,
        isCleared,
        countdownDisplay,
        answeredCount,
        lastResult,
      },
      previousRef.current,
      clearSoundVariant,
    );

    for (const command of commands) {
      runGameSoundCommand(command, soundEffects);
    }

    previousRef.current = nextPrevious;
  }, [
    answeredCount,
    clearSoundVariant,
    countdownDisplay,
    isCleared,
    isPlaying,
    isRoundActive,
    lastResult,
    screen,
    soundEffects,
  ]);

  useEffect(() => {
    return () => {
      soundEffects.stopBgm();
    };
  }, [soundEffects.stopBgm]);
};
