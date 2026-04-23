import { afterEach, describe, expect, it } from "vitest";
import { CURRENT_USER_ID_STORAGE_KEY, USERS_STORAGE_KEY } from "../keys";
import {
  loadActivePlayerId,
  loadPlayers,
  saveActivePlayerId,
  savePlayers,
} from "./playersRepo";

type StorageMap = Map<string, string>;

const installLocalStorage = (store: StorageMap) => {
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });
};

afterEach(() => {
  Reflect.deleteProperty(globalThis, "localStorage");
});

describe("playersRepo", () => {
  it("loads only valid players and normalizes names", () => {
    const store = new Map<string, string>([
      [
        USERS_STORAGE_KEY,
        JSON.stringify([
          { id: "p1", name: " Alice ", createdAt: 1_700_000_000_000 },
          { id: "p2", name: "", createdAt: 1_700_000_000_001 },
          { id: "p3", name: "Bob", createdAt: "bad" },
          42,
        ]),
      ],
    ]);
    installLocalStorage(store);

    expect(loadPlayers()).toEqual([
      { id: "p1", name: "Alice", createdAt: 1_700_000_000_000 },
    ]);
  });

  it("falls back to empty players when stored value is invalid", () => {
    const store = new Map<string, string>([
      [USERS_STORAGE_KEY, '{"bad":true}'],
    ]);
    installLocalStorage(store);

    expect(loadPlayers()).toEqual([]);
  });

  it("loads and saves active player id", () => {
    const store = new Map<string, string>([
      [CURRENT_USER_ID_STORAGE_KEY, "player-1"],
    ]);
    installLocalStorage(store);

    expect(loadActivePlayerId()).toBe("player-1");

    saveActivePlayerId("player-2");
    expect(store.get(CURRENT_USER_ID_STORAGE_KEY)).toBe("player-2");

    saveActivePlayerId(null);
    expect(store.has(CURRENT_USER_ID_STORAGE_KEY)).toBe(false);
  });

  it("saves players", () => {
    const store = new Map<string, string>();
    installLocalStorage(store);

    savePlayers([{ id: "p1", name: "Alice", createdAt: 1_700_000_000_000 }]);

    expect(store.get(USERS_STORAGE_KEY)).toBe(
      JSON.stringify([
        { id: "p1", name: "Alice", createdAt: 1_700_000_000_000 },
      ]),
    );
  });
});
