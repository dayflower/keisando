import { afterEach, describe, expect, it } from "vitest";
import { SOUND_MUTED_STORAGE_KEY } from "../keys";
import { loadSoundMuted, saveSoundMuted } from "./soundRepo";

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

describe("soundRepo", () => {
  it("loads muted flag when valid true literal is stored", () => {
    const store = new Map<string, string>([[SOUND_MUTED_STORAGE_KEY, "true"]]);
    installLocalStorage(store);

    expect(loadSoundMuted()).toBe(true);
  });

  it("falls back to false when stored value is invalid", () => {
    const store = new Map<string, string>([
      [SOUND_MUTED_STORAGE_KEY, "invalid"],
    ]);
    installLocalStorage(store);

    expect(loadSoundMuted()).toBe(false);
  });

  it("saves boolean muted flag as string literal", () => {
    const store = new Map<string, string>();
    installLocalStorage(store);

    saveSoundMuted(true);
    expect(store.get(SOUND_MUTED_STORAGE_KEY)).toBe("true");

    saveSoundMuted(false);
    expect(store.get(SOUND_MUTED_STORAGE_KEY)).toBe("false");
  });
});
