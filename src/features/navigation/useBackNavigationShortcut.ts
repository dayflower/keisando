import { useEffect } from "react";
import type { Screen } from "../../shared/types";

const backShortcutScreens: Screen[] = [
  "playerSelect",
  "historyDetail",
  "ranking",
  "debug",
];

export const supportsBackNavigationShortcut = (screen: Screen): boolean =>
  backShortcutScreens.includes(screen);

export const isBackNavigationShortcutKey = (key: string): boolean =>
  key === "Escape" || key === "Esc" || key === "Backspace";

export const isEditableBackspaceTarget = (
  target: EventTarget | null,
): boolean => {
  if (target === null || typeof target !== "object") {
    return false;
  }

  const candidate = target as {
    isContentEditable?: boolean;
    tagName?: string;
  };

  if (candidate.isContentEditable === true) {
    return true;
  }

  const tagName = candidate.tagName?.toUpperCase();
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
};

type UseBackNavigationShortcutProps = {
  screen: Screen;
  onBack: () => void;
  onUiTap?: () => void;
};

export const useBackNavigationShortcut = ({
  screen,
  onBack,
  onUiTap,
}: UseBackNavigationShortcutProps) => {
  useEffect(() => {
    if (!supportsBackNavigationShortcut(screen)) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || !isBackNavigationShortcutKey(event.key)) {
        return;
      }

      if (
        event.key === "Backspace" &&
        isEditableBackspaceTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      onUiTap?.();
      onBack();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onBack, onUiTap, screen]);
};
