import { type RefObject, useEffect, useEffectEvent } from "react";
import type { QuestionOption } from "../../shared/types";
import {
  getAnswerChoiceIndexByArrowKey,
  getPlayingShortcutAction,
} from "./keyboardShortcuts";
import type { EffectOrigin } from "./useGameSession";

type UsePlayingKeyboardShortcutsInput = {
  isCleared: boolean;
  canAdvanceToNextStage: boolean;
  isRoundActive: boolean;
  options: QuestionOption[];
  choiceButtonRefs: RefObject<Array<HTMLButtonElement | null>>;
  onAnswer: (selected: QuestionOption, effectOrigin?: EffectOrigin) => void;
  onKeyboardChoiceTrigger?: (choiceIndex: number) => void;
  onBackToStageSelect: () => void;
  onResetStage: () => void;
  onStartNextStage: () => void;
  onUiTap?: () => void;
};

const getChoiceEffectOriginByIndex = (
  choiceButtonRefs: RefObject<Array<HTMLButtonElement | null>>,
  choiceIndex: number,
): EffectOrigin => {
  const button = choiceButtonRefs.current[choiceIndex];
  if (!button) {
    return { x: 0, y: 0 };
  }

  const rect = button.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

export const usePlayingKeyboardShortcuts = ({
  isCleared,
  canAdvanceToNextStage,
  isRoundActive,
  options,
  choiceButtonRefs,
  onAnswer,
  onKeyboardChoiceTrigger,
  onBackToStageSelect,
  onResetStage,
  onStartNextStage,
  onUiTap,
}: UsePlayingKeyboardShortcutsInput) => {
  const resolveChoiceIndex = (key: string): number | null => {
    const choiceIndex = getAnswerChoiceIndexByArrowKey(key);
    if (choiceIndex === null) {
      return null;
    }

    if (options.length !== 2) {
      return choiceIndex;
    }

    if (key === "ArrowLeft") {
      return 0;
    }

    if (key === "ArrowRight") {
      return 1;
    }

    return null;
  };

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }

    const action = getPlayingShortcutAction(
      event.key,
      isCleared,
      canAdvanceToNextStage,
    );
    if (action === null) {
      return;
    }

    event.preventDefault();
    if (action === "back") {
      onUiTap?.();
      onBackToStageSelect();
      return;
    }
    if (action === "retry") {
      onUiTap?.();
      onResetStage();
      return;
    }
    if (action === "nextStage") {
      onUiTap?.();
      onStartNextStage();
      return;
    }
    if (!isRoundActive) {
      return;
    }

    const choiceIndex = resolveChoiceIndex(event.key);
    if (choiceIndex === null) {
      return;
    }

    const selected = options[choiceIndex];
    if (selected === undefined) {
      return;
    }

    choiceButtonRefs.current[choiceIndex]?.blur();
    onKeyboardChoiceTrigger?.(choiceIndex);
    onAnswer(
      selected,
      getChoiceEffectOriginByIndex(choiceButtonRefs, choiceIndex),
    );
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
};
