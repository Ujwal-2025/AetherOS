/**
 * Explicit Zustand PersistStorage implementation for web (localStorage).
 * Bypasses createJSONStorage to avoid the window.localStorage timing
 * issue in Expo Metro's module initialization context.
 *
 * The Zustand persist middleware passes already-structured
 * { state, version } objects here — we just JSON-stringify/parse them.
 */

type StorageValue = { state: unknown; version?: number };

function getLocalStorage(): Storage | null {
  try {
    // `localStorage` (not `window.localStorage`) is more reliable in
    // React Native Web + Metro bundler environments
    if (typeof localStorage !== 'undefined') return localStorage;
    return null;
  } catch {
    return null;
  }
}

export const appStorage = {
  getItem: (name: string): StorageValue | null => {
    try {
      const raw = getLocalStorage()?.getItem(name);
      return raw ? (JSON.parse(raw) as StorageValue) : null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: StorageValue): void => {
    try {
      getLocalStorage()?.setItem(name, JSON.stringify(value));
    } catch {}
  },
  removeItem: (name: string): void => {
    try {
      getLocalStorage()?.removeItem(name);
    } catch {}
  },
};
