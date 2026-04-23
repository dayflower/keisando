import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  PlayerLifetimeSummary,
  PlayHistoryRecord,
  StageLifetimeSummary,
} from "../../shared/types";

type HookSlot = { value: unknown };

let activeRuntime: ReturnType<typeof createHookRuntime> | null = null;
let mockHistoryRecords: PlayHistoryRecord[] = [];
let mockLifetimeSummary: PlayerLifetimeSummary = {
  playerId: "player-1",
  totalPlays: 0,
  totalClears: 0,
  lastPlayedAt: null,
  currentCorrectStreak: 0,
  bestCorrectStreak: 0,
};
let mockStageSummaries: StageLifetimeSummary[] = [];

vi.mock("react", () => ({
  useState: <T>(initial: T | (() => T)) => {
    if (!activeRuntime) {
      throw new Error("useState called outside of hook runtime");
    }

    return activeRuntime.useState(initial);
  },
  useEffect: (effect: () => undefined | (() => void)) => {
    if (!activeRuntime) {
      throw new Error("useEffect called outside of hook runtime");
    }

    activeRuntime.useEffect(effect);
  },
  useCallback: <T extends (...args: never[]) => unknown>(callback: T) => {
    if (!activeRuntime) {
      throw new Error("useCallback called outside of hook runtime");
    }

    return activeRuntime.useCallback(callback);
  },
}));

vi.mock("../../storage/repositories/historyRepo", () => ({
  createDefaultLifetimeSummary: (playerId: string): PlayerLifetimeSummary => ({
    playerId,
    totalPlays: 0,
    totalClears: 0,
    lastPlayedAt: null,
    currentCorrectStreak: 0,
    bestCorrectStreak: 0,
  }),
  loadLifetimeSummary: () => mockLifetimeSummary,
  loadPlayerHistory: () => mockHistoryRecords,
  loadStageSummaries: () => mockStageSummaries,
  saveLifetimeSummary: (_playerId: string, summary: PlayerLifetimeSummary) => {
    mockLifetimeSummary = summary;
  },
  savePlayerHistory: (_playerId: string, records: PlayHistoryRecord[]) => {
    mockHistoryRecords = records;
  },
  saveStageSummaries: (
    _playerId: string,
    summaries: StageLifetimeSummary[],
  ) => {
    mockStageSummaries = summaries;
  },
}));

const createHookRuntime = () => {
  const slots: HookSlot[] = [];
  let cursor = 0;
  let pendingEffects: Array<() => void> = [];

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

      if (!slots[index]) {
        slots[index] = {
          value:
            typeof initial === "function" ? (initial as () => T)() : initial,
        };
      }

      const setValue = (value: T | ((current: T) => T)) => {
        const currentValue = slots[index]?.value as T;
        slots[index] = {
          value:
            typeof value === "function"
              ? (value as (current: T) => T)(currentValue)
              : value,
        };
      };

      return [slots[index].value as T, setValue] as const;
    },
    useEffect(effect: () => undefined | (() => void)) {
      cursor += 1;
      pendingEffects.push(() => {
        effect();
      });
    },
    useCallback<T extends (...args: never[]) => unknown>(callback: T) {
      cursor += 1;
      return callback;
    },
  };
};

describe("useHistory", () => {
  afterEach(() => {
    mockHistoryRecords = [];
    mockLifetimeSummary = {
      playerId: "player-1",
      totalPlays: 0,
      totalClears: 0,
      lastPlayedAt: null,
      currentCorrectStreak: 0,
      bestCorrectStreak: 0,
    };
    mockStageSummaries = [];
    activeRuntime = null;
    vi.resetModules();
  });

  it("keeps the latest streak when a correct answer is immediately followed by a clear", async () => {
    const runtime = createHookRuntime();
    const { useHistory } = await import("./useHistory");

    const hook = runtime.render(() =>
      useHistory({ activePlayerId: "player-1" }),
    );

    hook.recordAnsweredQuestion({ playerId: "player-1", isCorrect: true });
    hook.appendClearRecord({
      playerId: "player-1",
      stageId: "stage1",
      durationMs: 1_000,
      playedAt: 2_000,
      mistakeCount: 0,
    });

    expect(mockLifetimeSummary).toEqual({
      playerId: "player-1",
      totalPlays: 1,
      totalClears: 1,
      lastPlayedAt: 2_000,
      currentCorrectStreak: 1,
      bestCorrectStreak: 1,
    });
  });
});
