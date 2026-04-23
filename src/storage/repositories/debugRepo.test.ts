import { afterEach, describe, expect, it } from "vitest";
import { clearAppStorage } from "./debugRepo";
import {
  installTestLocalStorage,
  resetTestLocalStorage,
} from "./testLocalStorage";

afterEach(() => {
  resetTestLocalStorage();
});

describe("debugRepo", () => {
  it("clears only keisando-prefixed keys", () => {
    const store = new Map<string, string>([
      ["keisando:users", "[]"],
      ["keisando:records:v1", "[]"],
      ["other-app:key", "keep"],
    ]);
    installTestLocalStorage(store);

    clearAppStorage();

    expect(store.has("keisando:users")).toBe(false);
    expect(store.has("keisando:records:v1")).toBe(false);
    expect(store.get("other-app:key")).toBe("keep");
  });
});
