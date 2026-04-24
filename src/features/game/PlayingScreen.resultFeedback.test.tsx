import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlayingScreenProps } from "./PlayingScreen";

type HookSlot =
  | { kind: "state"; value: unknown }
  | { kind: "ref"; value: { current: unknown } }
  | { kind: "effect"; deps: unknown[] | undefined; cleanup?: () => void };

type HookRuntime = ReturnType<typeof createHookRuntime>;
type PlayingScreenModule = typeof import("./PlayingScreen");

let activeRuntime: HookRuntime | null = null;

const messages = {
  "playing.answered": "回答数",
  "playing.remaining": "残り",
  "playing.progress": "問題進捗",
  "playing.time": "タイム",
  "playing.best": "ベスト",
  "playing.resultCorrect": "正解!",
  "playing.resultWrong": "不正解! +1問",
  "playing.comboMilestone": "{count} COMBO!",
  "common.backToStageSelect": "ステージ選択へ戻る",
};

const createHookRuntime = () => {
  const slots: HookSlot[] = [];
  let cursor = 0;
  let pendingEffects: Array<() => void> = [];

  const assertSlot = <T extends HookSlot["kind"]>(
    index: number,
    kind: T,
  ): Extract<HookSlot, { kind: T }> | undefined => {
    const slot = slots[index];
    if (!slot) {
      return undefined;
    }
    if (slot.kind !== kind) {
      throw new Error(`Hook slot mismatch at ${index}: expected ${kind}`);
    }
    return slot as Extract<HookSlot, { kind: T }>;
  };

  return {
    render<T>(callback: () => T): T {
      cursor = 0;
      pendingEffects = [];
      activeRuntime = this;
      const result = callback();
      activeRuntime = null;

      for (const runEffect of pendingEffects) {
        runEffect();
      }

      return result;
    },
    useState<T>(initial: T | (() => T)) {
      const index = cursor;
      cursor += 1;
      const existing = assertSlot(index, "state");

      if (!existing) {
        slots[index] = {
          kind: "state",
          value:
            typeof initial === "function" ? (initial as () => T)() : initial,
        };
      }

      const current = assertSlot(index, "state");
      if (!current) {
        throw new Error(`Missing state slot at ${index}`);
      }

      const setValue = (value: T | ((current: T) => T)) => {
        const slot = assertSlot(index, "state");
        if (!slot) {
          throw new Error(`Missing state slot at ${index}`);
        }

        slot.value =
          typeof value === "function"
            ? (value as (current: T) => T)(slot.value as T)
            : value;
      };

      return [current.value as T, setValue] as const;
    },
    useRef<T>(initial: T) {
      const index = cursor;
      cursor += 1;
      const existing = assertSlot(index, "ref");

      if (!existing) {
        slots[index] = {
          kind: "ref",
          value: { current: initial },
        };
      }

      const current = assertSlot(index, "ref");
      if (!current) {
        throw new Error(`Missing ref slot at ${index}`);
      }

      return current.value as { current: T };
    },
    useEffect(effect: () => undefined | (() => void), deps?: unknown[]) {
      const index = cursor;
      cursor += 1;
      const existing = assertSlot(index, "effect");
      const shouldRun =
        !existing ||
        !deps ||
        !existing.deps ||
        deps.length !== existing.deps.length ||
        deps.some(
          (dep, depIndex) => !Object.is(dep, existing.deps?.[depIndex]),
        );

      slots[index] = {
        kind: "effect",
        deps,
        cleanup: existing?.cleanup,
      };

      if (!shouldRun) {
        return;
      }

      pendingEffects.push(() => {
        const current = assertSlot(index, "effect");
        current?.cleanup?.();
        const cleanup = effect();
        if (current) {
          current.cleanup = cleanup ?? undefined;
        }
      });
    },
    dispose() {
      for (const slot of slots) {
        if (slot?.kind === "effect") {
          slot.cleanup?.();
        }
      }
    },
  };
};

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
  answeredCount: 1,
  requiredCount: 10,
  currentCombo: 0,
  comboEffectTick: 0,
  comboMilestoneTick: 0,
  comboMilestoneValue: 0,
  comboEffectOrigin: { x: 0, y: 0 },
  remainingCount: 9,
  elapsedMs: 2134,
  bestTimeMs: 2134,
  isCleared: false,
  isRoundActive: true,
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

const loadPlayingScreenModule = async (): Promise<PlayingScreenModule> => {
  vi.resetModules();
  vi.doMock("react", () => ({
    useState<T>(initial: T | (() => T)) {
      if (!activeRuntime) {
        throw new Error("useState called outside of hook runtime");
      }

      return activeRuntime.useState(initial);
    },
    useRef<T>(initial: T) {
      if (!activeRuntime) {
        throw new Error("useRef called outside of hook runtime");
      }

      return activeRuntime.useRef(initial);
    },
    useEffect(effect: () => undefined | (() => void), deps?: unknown[]) {
      if (!activeRuntime) {
        throw new Error("useEffect called outside of hook runtime");
      }

      activeRuntime.useEffect(effect, deps);
    },
  }));
  vi.doMock("../../shared/i18n", () => ({
    getStageName: () => "Stage 1",
    getStageTag: () => "足し算",
    useI18n: () => ({
      locale: "ja",
      t: (key: keyof typeof messages, values?: { count?: number }): string => {
        const template = messages[key] ?? key;
        if (values?.count === undefined) {
          return template;
        }
        return template.replace("{count}", String(values.count));
      },
    }),
  }));
  vi.doMock("../sound/SoundToggleButton", () => ({
    SoundToggleButton: () => null,
  }));
  vi.doMock("./usePlayingKeyboardShortcuts", () => ({
    usePlayingKeyboardShortcuts: () => {},
  }));

  return import("./PlayingScreen");
};

type ReactNodeLike =
  | string
  | number
  | boolean
  | null
  | undefined
  | {
      props?: {
        className?: string;
        children?: ReactNodeLike | ReactNodeLike[];
      };
    };

const findResultElement = (
  node: ReactNodeLike | ReactNodeLike[],
): ReactNodeLike | null => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findResultElement(child);
      if (match !== null) {
        return match;
      }
    }
    return null;
  }

  if (
    node &&
    typeof node === "object" &&
    "props" in node &&
    typeof node.props?.className === "string" &&
    node.props.className.includes("result-text")
  ) {
    return node;
  }

  if (
    node &&
    typeof node === "object" &&
    "props" in node &&
    node.props?.children !== undefined
  ) {
    return findResultElement(node.props.children);
  }

  return null;
};

const readResultText = (
  node: ReactNodeLike | ReactNodeLike[] | null,
): string => {
  if (Array.isArray(node)) {
    return node.map((child) => readResultText(child)).join("");
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (node && typeof node === "object" && "props" in node) {
    return readResultText(node.props?.children);
  }

  return "";
};

const readResultClassName = (node: ReactNodeLike | null): string => {
  if (
    node &&
    typeof node === "object" &&
    "props" in node &&
    typeof node.props?.className === "string"
  ) {
    return node.props.className;
  }

  return "";
};

describe("PlayingScreen result feedback timing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
  });

  afterEach(() => {
    activeRuntime = null;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("hides the result feedback after the fade duration", async () => {
    const runtime = createHookRuntime();
    const { PlayingScreen } = await loadPlayingScreenModule();
    const props = buildProps({
      lastResult: "correct",
      answeredCount: 1,
    });

    let tree = runtime.render(() => PlayingScreen(props));
    let resultElement = findResultElement(tree);

    expect(readResultText(resultElement)).toBe("正解!");
    expect(readResultClassName(resultElement)).toContain("result-text-active");

    vi.advanceTimersByTime(720);
    tree = runtime.render(() => PlayingScreen(props));
    resultElement = findResultElement(tree);

    expect(readResultText(resultElement)).toBe("");
    expect(readResultClassName(resultElement)).toBe("result-text");

    runtime.dispose();
  });

  it("restarts the timer for the latest answer", async () => {
    const runtime = createHookRuntime();
    const { PlayingScreen } = await loadPlayingScreenModule();

    let props = buildProps({
      lastResult: "correct",
      answeredCount: 1,
    });

    runtime.render(() => PlayingScreen(props));
    vi.advanceTimersByTime(500);

    props = buildProps({
      lastResult: "wrong",
      answeredCount: 2,
      wrongAnswerCount: 1,
      requiredCount: 11,
      remainingCount: 9,
    });

    runtime.render(() => PlayingScreen(props));
    let tree = runtime.render(() => PlayingScreen(props));
    let resultElement = findResultElement(tree);

    expect(readResultText(resultElement)).toBe("不正解! +1問");

    vi.advanceTimersByTime(219);
    tree = runtime.render(() => PlayingScreen(props));
    resultElement = findResultElement(tree);
    expect(readResultText(resultElement)).toBe("不正解! +1問");

    vi.advanceTimersByTime(1);
    tree = runtime.render(() => PlayingScreen(props));
    resultElement = findResultElement(tree);
    expect(readResultText(resultElement)).toBe("不正解! +1問");

    vi.advanceTimersByTime(500);
    tree = runtime.render(() => PlayingScreen(props));
    resultElement = findResultElement(tree);
    expect(readResultText(resultElement)).toBe("");

    runtime.dispose();
  });
});
