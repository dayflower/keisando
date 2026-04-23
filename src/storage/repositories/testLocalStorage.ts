export type StorageMap = Map<string, string>;

type TestLocalStorageOptions = {
  failGetItem?: boolean;
  failSetItem?: boolean;
  failRemoveItem?: boolean;
};

export const installTestLocalStorage = (
  store: StorageMap,
  options?: TestLocalStorageOptions,
) => {
  const localStorageMock = {
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
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
    clear: () => {
      store.clear();
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });
};

export const resetTestLocalStorage = () => {
  Reflect.deleteProperty(globalThis, "localStorage");
};
