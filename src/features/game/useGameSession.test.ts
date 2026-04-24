import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROUND_COUNTDOWN_SECONDS } from "../../shared/constants";
import type {
  Player,
  StageDefinition,
  StageExpression,
  StageRunRecord,
} from "../../shared/types";
import type {
  AnswerResolvedPayload,
  StageFinishedPayload,
} from "./useGameSession";

type HookSlot =
  | { kind: "state"; value: unknown }
  | { kind: "ref"; value: { current: unknown } }
  | { kind: "effect"; deps: unknown[] | undefined; cleanup?: () => void };

type HookRuntime = ReturnType<typeof createHookRuntime>;
type UseGameSessionModule = typeof import("./useGameSession");

let activeRuntime: HookRuntime | null = null;

vi.mock("react", () => ({
  useState: <T>(initial: T | (() => T)) => {
    if (!activeRuntime) {
      throw new Error("useState called outside of hook runtime");
    }

    return activeRuntime.useState(initial);
  },
  useRef: <T>(initial: T) => {
    if (!activeRuntime) {
      throw new Error("useRef called outside of hook runtime");
    }

    return activeRuntime.useRef(initial);
  },
  useMemo: <T>(factory: () => T) => {
    if (!activeRuntime) {
      throw new Error("useMemo called outside of hook runtime");
    }

    return activeRuntime.useMemo(factory);
  },
  useEffect: (effect: () => undefined | (() => void), deps?: unknown[]) => {
    if (!activeRuntime) {
      throw new Error("useEffect called outside of hook runtime");
    }

    activeRuntime.useEffect(effect, deps);
  },
}));

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
    useMemo<T>(factory: () => T): T {
      cursor += 1;
      return factory();
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

const loadUseGameSessionModule = async (): Promise<UseGameSessionModule> => {
  vi.resetModules();
  return import("./useGameSession");
};

const createTestStage = () => {
  let expressionId = 0;

  const stage: StageDefinition = {
    id: "test-stage",
    baseQuestionCount: 1,
    defaultClearCondition: {
      maxElapsedMs: 15_000,
      maxMistakes: 0,
    },
    createExpression: (): StageExpression => {
      expressionId += 1;
      return {
        left: expressionId,
        right: 10,
        operator: "+",
        answer: expressionId + 10,
      };
    },
    createOptions: (expression) => [
      { label: String(expression.answer), isCorrect: true },
      { label: String(expression.answer - 1), isCorrect: false },
      { label: String(expression.answer + 1), isCorrect: false },
      { label: String(expression.answer + 2), isCorrect: false },
    ],
  };

  return stage;
};

const createPlayer = (): Player => ({
  id: "player-1",
  name: "Player 1",
  createdAt: 1,
});

const createRecord = (elapsedMs: number): StageRunRecord => ({
  id: `record-${elapsedMs}`,
  playerId: "player-1",
  stageId: "test-stage",
  elapsedMs,
  requiredCount: 1,
  wrongCount: 0,
  recordedAt: 500,
});

const createWindowMock = () => {
  let nextTimerId = 1;
  const intervals = new Map<number, () => void>();

  return {
    window: {
      setInterval: vi.fn((callback: () => void) => {
        const timerId = nextTimerId;
        nextTimerId += 1;
        intervals.set(timerId, callback);
        return timerId;
      }),
      clearInterval: vi.fn((timerId: number) => {
        intervals.delete(timerId);
      }),
    },
    tickAll: () => {
      for (const callback of intervals.values()) {
        callback();
      }
    },
  };
};

const renderHook = async ({
  activePlayer = createPlayer(),
  records = [createRecord(2400)],
  onAnswerResolved = vi.fn(),
  onStageFinished = vi.fn(),
}: {
  activePlayer?: Player | null;
  records?: StageRunRecord[];
  onAnswerResolved?: (payload: AnswerResolvedPayload) => void;
  onStageFinished?: (payload: StageFinishedPayload) => void;
} = {}) => {
  const runtime = createHookRuntime();
  const module = await loadUseGameSessionModule();

  const render = () =>
    runtime.render(() =>
      module.useGameSession({
        activePlayer,
        records,
        onAnswerResolved,
        onStageFinished,
      }),
    );

  return {
    runtime,
    render,
  };
};

describe("useGameSession", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes countdown, combo, clear state, and bestTimeMs on startStage", async () => {
    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000);
    const { window } = createWindowMock();
    Object.assign(globalThis, { window });

    const stage = createTestStage();
    const { runtime, render } = await renderHook();

    let game = render();
    expect(game.startStage(stage)).toBe(true);

    game = render();

    expect(game.selectedStage?.id).toBe(stage.id);
    expect(game.playingPlayerId).toBe("player-1");
    expect(game.question).not.toBeNull();
    expect(game.countdownDisplay).toBe(ROUND_COUNTDOWN_SECONDS);
    expect(game.answeredCount).toBe(0);
    expect(game.requiredCount).toBe(stage.baseQuestionCount);
    expect(game.currentCombo).toBe(0);
    expect(game.lastResult).toBeNull();
    expect(game.isRoundActive).toBe(false);
    expect(game.isPlaying).toBe(true);
    expect(game.isCleared).toBe(false);
    expect(game.bestTimeMs).toBe(2400);

    runtime.dispose();
  });

  it("resetStage regenerates the round state and keeps bestTimeMs after a clear", async () => {
    const nowSpy = vi.spyOn(Date, "now");
    const { window, tickAll } = createWindowMock();
    Object.assign(globalThis, { window });

    const onAnswerResolved = vi.fn();
    const onStageFinished = vi.fn();
    const stage = createTestStage();
    const { runtime, render } = await renderHook({
      onAnswerResolved,
      onStageFinished,
    });

    nowSpy.mockReturnValue(1_000);
    let game = render();
    game.startStage(stage);
    game = render();
    const initialQuestion = game.question;

    nowSpy.mockReturnValue(4_500);
    tickAll();
    game = render();
    game = render();

    expect(game.isRoundActive).toBe(true);

    nowSpy.mockReturnValue(8_000);
    game.handleAnswer(
      game.question?.options.find((option) => option.isCorrect) ?? {
        label: "",
        isCorrect: false,
      },
    );
    game = render();

    expect(game.isCleared).toBe(true);
    expect(game.elapsedMs).toBe(3_500);
    expect(game.lastResult).toBe("correct");
    expect(game.bestTimeMs).toBe(2400);
    expect(onAnswerResolved).toHaveBeenCalledWith({
      playerId: "player-1",
      isCorrect: true,
    });
    expect(onAnswerResolved.mock.invocationCallOrder[0]).toBeLessThan(
      onStageFinished.mock.invocationCallOrder[0],
    );
    expect(onStageFinished).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(9_000);
    game.resetStage();
    game = render();

    expect(game.question).not.toEqual(initialQuestion);
    expect(game.countdownDisplay).toBe(ROUND_COUNTDOWN_SECONDS);
    expect(game.answeredCount).toBe(0);
    expect(game.requiredCount).toBe(stage.baseQuestionCount);
    expect(game.currentCombo).toBe(0);
    expect(game.elapsedMs).toBe(0);
    expect(game.lastResult).toBeNull();
    expect(game.isRoundActive).toBe(false);
    expect(game.isCleared).toBe(false);
    expect(game.bestTimeMs).toBe(2400);

    runtime.dispose();
  });

  it("reports wrong answers before continuing the round", async () => {
    const nowSpy = vi.spyOn(Date, "now");
    const { window, tickAll } = createWindowMock();
    Object.assign(globalThis, { window });

    const onAnswerResolved = vi.fn();
    const onStageFinished = vi.fn();
    const stage = createTestStage();
    const { runtime, render } = await renderHook({
      onAnswerResolved,
      onStageFinished,
    });

    nowSpy.mockReturnValue(1_000);
    let game = render();
    game.startStage(stage);
    game = render();

    nowSpy.mockReturnValue(4_500);
    tickAll();
    game = render();
    game = render();

    game.handleAnswer({ label: "", isCorrect: false });
    game = render();

    expect(game.lastResult).toBe("wrong");
    expect(game.answeredCount).toBe(1);
    expect(game.requiredCount).toBe(2);
    expect(game.isCleared).toBe(false);
    expect(onAnswerResolved).toHaveBeenCalledWith({
      playerId: "player-1",
      isCorrect: false,
    });
    expect(onStageFinished).not.toHaveBeenCalled();

    runtime.dispose();
  });

  it("stopSession resets the playing state to a stopped session", async () => {
    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000);
    const { window } = createWindowMock();
    Object.assign(globalThis, { window });

    const stage = createTestStage();
    const { runtime, render } = await renderHook();

    let game = render();
    game.startStage(stage);
    game = render();

    nowSpy.mockReturnValue(7_500);
    game.stopSession();
    game = render();

    expect(game.selectedStage).toBeNull();
    expect(game.question).toBeNull();
    expect(game.playingPlayerId).toBeNull();
    expect(game.answeredCount).toBe(0);
    expect(game.requiredCount).toBe(0);
    expect(game.currentCombo).toBe(0);
    expect(game.lastResult).toBeNull();
    expect(game.isRoundActive).toBe(false);
    expect(game.isPlaying).toBe(false);
    expect(game.isCleared).toBe(false);
    expect(game.bestTimeMs).toBeNull();
    expect(game.countdownDisplay).toBe(ROUND_COUNTDOWN_SECONDS);

    runtime.dispose();
  });

  afterEach(() => {
    Object.assign(globalThis, { window: originalWindow });
  });
});
