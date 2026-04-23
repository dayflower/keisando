import { afterEach, describe, expect, it } from "vitest";
import {
  loadStoredJson,
  loadStoredValue,
  removeStoredValue,
  saveJson,
  saveStoredValue,
} from "./storageHelpers";
import {
  installTestLocalStorage,
  resetTestLocalStorage,
} from "./testLocalStorage";

afterEach(() => {
  resetTestLocalStorage();
});

describe("storageHelpers", () => {
  it("returns fallback when JSON key is missing", () => {
    installTestLocalStorage(new Map<string, string>());

    expect(loadStoredJson("missing", { ok: false })).toEqual({ ok: false });
  });

  it("returns fallback when stored JSON is invalid", () => {
    installTestLocalStorage(new Map<string, string>([["broken", "{invalid"]]));

    expect(loadStoredJson("broken", ["fallback"])).toEqual(["fallback"]);
  });

  it("returns fallback when getItem throws", () => {
    installTestLocalStorage(new Map<string, string>(), { failGetItem: true });

    expect(loadStoredJson("key", 123)).toBe(123);
    expect(loadStoredValue("key")).toBeNull();
  });

  it("ignores setItem errors", () => {
    const store = new Map<string, string>();
    installTestLocalStorage(store, { failSetItem: true });

    expect(() => saveJson("json", { ok: true })).not.toThrow();
    expect(() => saveStoredValue("raw", "value")).not.toThrow();
    expect(store.size).toBe(0);
  });

  it("ignores removeItem errors", () => {
    const store = new Map<string, string>([["raw", "value"]]);
    installTestLocalStorage(store, { failRemoveItem: true });

    expect(() => removeStoredValue("raw")).not.toThrow();
    expect(store.get("raw")).toBe("value");
  });
});
