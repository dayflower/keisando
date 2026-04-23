import { type RefObject, useEffect } from "react";
import {
  getStageFocusMoveTarget,
  isStageSelectBlurKey,
} from "./keyboardShortcuts";

type UseStageSelectKeyboardNavigationInput = {
  canStartStage: boolean;
  stageButtonRefs: RefObject<Array<HTMLButtonElement | null>>;
};

export const useStageSelectKeyboardNavigation = ({
  canStartStage,
  stageButtonRefs,
}: UseStageSelectKeyboardNavigationInput) => {
  useEffect(() => {
    if (!canStartStage) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isStageSelectBlurKey(event.key)) {
        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLElement &&
          activeElement !== document.body
        ) {
          event.preventDefault();
          activeElement.blur();
        }
        return;
      }

      const stageButtons = stageButtonRefs.current.filter(
        (button): button is HTMLButtonElement => button !== null,
      );
      const focusedIndex = stageButtons.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      const fromIndex = focusedIndex === -1 ? 0 : focusedIndex;
      const targetIndex = getStageFocusMoveTarget(
        fromIndex,
        event.key,
        stageButtons.length,
      );

      if (targetIndex === null) {
        return;
      }

      event.preventDefault();
      stageButtons[targetIndex]?.focus();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [canStartStage, stageButtonRefs]);
};
