import { afterEach, describe, expect, it, vi } from "vitest";

type HookSlot = { value: unknown };

let activeRuntime: ReturnType<typeof createHookRuntime> | null = null;
let mockPlayers: Array<{ id: string; name: string; createdAt: number }> = [];
let mockActivePlayerId: string | null = null;

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
  useMemo: <T>(factory: () => T) => {
    if (!activeRuntime) {
      throw new Error("useMemo called outside of hook runtime");
    }

    return activeRuntime.useMemo(factory);
  },
}));

vi.mock("../../storage/repositories/playersRepo", () => ({
  loadPlayers: () => mockPlayers,
  loadActivePlayerId: () => mockActivePlayerId,
  savePlayers: (players: typeof mockPlayers) => {
    mockPlayers = players;
  },
  saveActivePlayerId: (playerId: string | null) => {
    mockActivePlayerId = playerId;
  },
  normalizeAndValidatePlayerName: (name: string) => {
    const normalized = name.trim();
    if (normalized.length === 0 || normalized.length > 20) {
      return null;
    }

    return normalized;
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
    useMemo<T>(factory: () => T) {
      cursor += 1;
      return factory();
    },
  };
};

describe("usePlayers", () => {
  afterEach(() => {
    mockPlayers = [];
    mockActivePlayerId = null;
    activeRuntime = null;
    vi.resetModules();
  });

  it("returns an invalid-name error code for blank names", async () => {
    const runtime = createHookRuntime();
    const { usePlayers } = await import("./usePlayers");

    const hook = runtime.render(() => usePlayers());
    const result = hook.registerPlayer("   ");

    expect(result).toEqual({
      ok: false,
      errorCode: "playerNameInvalid",
    });
  });

  it("returns a duplicate-name error code for case-insensitive duplicates", async () => {
    mockPlayers = [{ id: "player-1", name: "Alice", createdAt: 1 }];

    const runtime = createHookRuntime();
    const { usePlayers } = await import("./usePlayers");

    const hook = runtime.render(() => usePlayers());
    const result = hook.registerPlayer("alice");

    expect(result).toEqual({
      ok: false,
      errorCode: "playerNameDuplicate",
    });
  });
});
