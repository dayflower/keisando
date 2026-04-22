import { afterEach, describe, expect, it } from "vitest";
import { clearAppStorage } from "./debugRepo";

type StorageMap = Map<string, string>;

const installLocalStorage = (store: StorageMap) => {
  const localStorageMock = {
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
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

describe("debugRepo", () => {
  it("clears only keisando-prefixed keys", () => {
    const store = new Map<string, string>([
      ["keisando:users", "[]"],
      ["keisando:records:v1", "[]"],
      ["other-app:key", "keep"],
    ]);
    installLocalStorage(store);

    clearAppStorage();

    expect(store.has("keisando:users")).toBe(false);
    expect(store.has("keisando:records:v1")).toBe(false);
    expect(store.get("other-app:key")).toBe("keep");
  });
});
