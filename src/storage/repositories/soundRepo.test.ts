import { afterEach, describe, expect, it } from "vitest";
import { SOUND_MUTED_STORAGE_KEY } from "../keys";
import { loadSoundMuted, saveSoundMuted } from "./soundRepo";
import {
  installTestLocalStorage,
  resetTestLocalStorage,
} from "./testLocalStorage";

afterEach(() => {
  resetTestLocalStorage();
});

describe("soundRepo", () => {
  it("loads muted flag when valid true literal is stored", () => {
    const store = new Map<string, string>([[SOUND_MUTED_STORAGE_KEY, "true"]]);
    installTestLocalStorage(store);

    expect(loadSoundMuted()).toBe(true);
  });

  it("falls back to false when stored value is invalid", () => {
    const store = new Map<string, string>([
      [SOUND_MUTED_STORAGE_KEY, "invalid"],
    ]);
    installTestLocalStorage(store);

    expect(loadSoundMuted()).toBe(false);
  });

  it("saves boolean muted flag as string literal", () => {
    const store = new Map<string, string>();
    installTestLocalStorage(store);

    saveSoundMuted(true);
    expect(store.get(SOUND_MUTED_STORAGE_KEY)).toBe("true");

    saveSoundMuted(false);
    expect(store.get(SOUND_MUTED_STORAGE_KEY)).toBe("false");
  });
});
