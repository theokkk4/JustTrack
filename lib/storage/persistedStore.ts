import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A tiny store that lives in memory and mirrors itself to on-device storage
 * (localStorage on the web). Read it with React's useSyncExternalStore.
 *
 * Nothing here ever leaves the device: there's no account and no server.
 */
export interface PersistedStore<T> {
  key: string;
  getSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
  /** Replaces the value (and saves it). Listeners run synchronously. */
  set: (update: T | ((current: T) => T)) => void;
  /** Loads the saved value once; later calls return the same promise. */
  hydrate: () => Promise<void>;
  isHydrated: () => boolean;
}

export function createPersistedStore<T>(key: string, initial: T, parse: (raw: unknown) => T | null): PersistedStore<T> {
  let value = initial;
  let hydrated = false;
  let hydration: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const save = (next: T) => {
    AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {
      // Private browsing or a full disk: the app keeps working for this session.
    });
  };

  return {
    key,
    getSnapshot: () => value,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set: (update) => {
      value = typeof update === 'function' ? (update as (current: T) => T)(value) : update;
      save(value);
      notify();
    },
    hydrate: () => {
      hydration ??= AsyncStorage.getItem(key)
        .then((raw) => {
          if (raw === null) return;
          const parsed = parse(JSON.parse(raw) as unknown);
          if (parsed !== null) {
            value = parsed;
            notify();
          }
        })
        .catch(() => {
          // Unreadable or corrupt: start fresh rather than crash.
        })
        .finally(() => {
          hydrated = true;
          notify();
        });
      return hydration;
    },
    isHydrated: () => hydrated,
  };
}
