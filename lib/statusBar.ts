import { useCallback, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Which status-bar text reads on the screen in front: light over a violet
 * header or a photo, dark over a plain page. Screens with a dark top
 * declare it with useLightStatusBar(); it only counts while they're focused,
 * so a white modal over Home flips the bar back to dark.
 */

let lightScreens = 0;
const listeners = new Set<() => void>();

function change(delta: number) {
  lightScreens += delta;
  listeners.forEach((listener) => listener());
}

export const statusBarStore = {
  getSnapshot: () => lightScreens > 0,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** True while a focused screen has asked for light status-bar text. */
export function useWantsLightStatusBar(): boolean {
  return useSyncExternalStore(statusBarStore.subscribe, statusBarStore.getSnapshot, statusBarStore.getSnapshot);
}

/** Call from a screen whose top is dark (gradient header, photo hero, camera). */
export function useLightStatusBar(enabled = true): void {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      change(1);
      return () => change(-1);
    }, [enabled])
  );
}
