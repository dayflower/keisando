export type PlayingShortcutAction =
  | "answerTop"
  | "answerLeft"
  | "answerRight"
  | "answerBottom"
  | "back"
  | "retry";

export const getStageFocusMoveTarget = (
  currentIndex: number,
  key: string,
  totalCount: number,
): number | null => {
  if (totalCount <= 0) {
    return null;
  }

  const lastIndex = totalCount - 1;

  if (key === "ArrowUp" || key === "ArrowLeft") {
    return currentIndex <= 0 ? lastIndex : currentIndex - 1;
  }

  if (key === "ArrowDown" || key === "ArrowRight") {
    return currentIndex >= lastIndex ? 0 : currentIndex + 1;
  }

  return null;
};

export const isStageSelectBlurKey = (key: string): boolean => key === "Escape";

export const getAnswerChoiceIndexByArrowKey = (key: string): number | null => {
  switch (key) {
    case "ArrowUp":
      return 0;
    case "ArrowLeft":
      return 1;
    case "ArrowRight":
      return 2;
    case "ArrowDown":
      return 3;
    default:
      return null;
  }
};

export const getPlayingShortcutAction = (
  key: string,
  isCleared: boolean,
): PlayingShortcutAction | null => {
  if (isCleared) {
    if (key === "Escape" || key === "Esc" || key === "Backspace") {
      return "back";
    }
    if (key === "Enter" || key === " " || key === "Spacebar") {
      return "retry";
    }
    return null;
  }

  if (key === "Escape" || key === "Esc" || key === "Backspace") {
    return "back";
  }

  const answerChoiceIndex = getAnswerChoiceIndexByArrowKey(key);
  if (answerChoiceIndex === 0) {
    return "answerTop";
  }
  if (answerChoiceIndex === 1) {
    return "answerLeft";
  }
  if (answerChoiceIndex === 2) {
    return "answerRight";
  }
  if (answerChoiceIndex === 3) {
    return "answerBottom";
  }

  return null;
};
