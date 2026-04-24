import { type RefObject, useEffect, useEffectEvent } from "react";
import type { QuestionOption } from "../../shared/types";
import {
  getAnswerChoiceIndexByArrowKey,
  getPlayingShortcutAction,
} from "./keyboardShortcuts";
import type { EffectOrigin } from "./useGameSession";

type UsePlayingKeyboardShortcutsInput = {
  isCleared: boolean;
  isRoundActive: boolean;
  options: QuestionOption[];
  choiceButtonRefs: RefObject<Array<HTMLButtonElement | null>>;
  onAnswer: (selected: number, effectOrigin?: EffectOrigin) => void;
  onBackToStageSelect: () => void;
  onResetStage: () => void;
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
  isRoundActive,
  options,
  choiceButtonRefs,
  onAnswer,
  onBackToStageSelect,
  onResetStage,
  onUiTap,
}: UsePlayingKeyboardShortcutsInput) => {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }

    const action = getPlayingShortcutAction(event.key, isCleared);
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
    if (!isRoundActive) {
      return;
    }

    const choiceIndex = getAnswerChoiceIndexByArrowKey(event.key);
    if (choiceIndex === null) {
      return;
    }

    const selected = options[choiceIndex];
    if (selected === undefined) {
      return;
    }

    onAnswer(
      selected.value,
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
