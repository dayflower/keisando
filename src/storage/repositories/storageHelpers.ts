export const loadStoredValue = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const loadStoredJson = <T>(key: string, fallback: T): T => {
  const raw = loadStoredValue(key);
  if (raw === null) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const saveJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

export const saveStoredValue = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};

export const removeStoredValue = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};
