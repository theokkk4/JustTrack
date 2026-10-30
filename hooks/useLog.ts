import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { sumNutrition } from '@/lib/nutrition/calculateNutrition';
import { buildMealSections } from '@/lib/log/entries';
import { logStore, pruneLog } from '@/lib/log/logStore';
import { liveEntries, msUntilNextExpiry } from '@/lib/log/window';

/**
 * The live log: entries from the last 24 hours, grouped by meal, with
 * totals. Re-renders the moment an entry ages out, and after the app comes
 * back to the foreground, so the screen never shows something that's gone.
 */
export function useLog() {
  const all = useSyncExternalStore(logStore.subscribe, logStore.getSnapshot, logStore.getSnapshot);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => subscription.remove();
  }, []);

  // Wake up exactly when the oldest live entry expires.
  const wait = msUntilNextExpiry(all, now);
  useEffect(() => {
    if (wait === null) return;
    const timer = setTimeout(() => setNow(Date.now()), wait + 250);
    return () => clearTimeout(timer);
  }, [wait, all]);

  // Expired entries are also removed from storage, not just hidden.
  useEffect(() => {
    pruneLog(now);
  }, [now, all]);

  const entries = useMemo(() => liveEntries(all, now), [all, now]);
  const sections = useMemo(() => buildMealSections(entries), [entries]);
  const totals = useMemo(() => sumNutrition(entries), [entries]);

  return { entries, sections, totals, now };
}
