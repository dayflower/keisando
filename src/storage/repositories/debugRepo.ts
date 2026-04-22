const APP_STORAGE_KEY_PREFIX = "keisando:";

export const clearAppStorage = () => {
  try {
    const targetKeys: string[] = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(APP_STORAGE_KEY_PREFIX)) {
        targetKeys.push(key);
      }
    }

    for (const key of targetKeys) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};
