import { afterEach, describe, expect, it } from "vitest";
import {
  loadStoredJson,
  loadStoredValue,
  removeStoredValue,
  saveJson,
  saveStoredValue,
} from "./storageHelpers";

type StorageMap = Map<string, string>;

const installLocalStorage = (
  store: StorageMap,
  options?: {
    failGetItem?: boolean;
    failSetItem?: boolean;
    failRemoveItem?: boolean;
  },
) => {
  const localStorageMock = {
    getItem: (key: string) => {
      if (options?.failGetItem) {
        throw new Error("getItem failed");
      }

      return store.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (options?.failSetItem) {
        throw new Error("setItem failed");
      }

      store.set(key, value);
    },
    removeItem: (key: string) => {
      if (options?.failRemoveItem) {
        throw new Error("removeItem failed");
      }

      store.delete(key);
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

describe("storageHelpers", () => {
  it("returns fallback when JSON key is missing", () => {
    installLocalStorage(new Map<string, string>());

    expect(loadStoredJson("missing", { ok: false })).toEqual({ ok: false });
  });

  it("returns fallback when stored JSON is invalid", () => {
    installLocalStorage(new Map<string, string>([["broken", "{invalid"]]));

    expect(loadStoredJson("broken", ["fallback"])).toEqual(["fallback"]);
  });

  it("returns fallback when getItem throws", () => {
    installLocalStorage(new Map<string, string>(), { failGetItem: true });

    expect(loadStoredJson("key", 123)).toBe(123);
    expect(loadStoredValue("key")).toBeNull();
  });

  it("ignores setItem errors", () => {
    const store = new Map<string, string>();
    installLocalStorage(store, { failSetItem: true });

    expect(() => saveJson("json", { ok: true })).not.toThrow();
    expect(() => saveStoredValue("raw", "value")).not.toThrow();
    expect(store.size).toBe(0);
  });

  it("ignores removeItem errors", () => {
    const store = new Map<string, string>([["raw", "value"]]);
    installLocalStorage(store, { failRemoveItem: true });

    expect(() => removeStoredValue("raw")).not.toThrow();
    expect(store.get("raw")).toBe("value");
  });
});
