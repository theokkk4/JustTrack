import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { HeightUnit, WeightUnit } from '@/types';

const STORAGE_KEY = 'justtrack.preferences';

export interface Preferences {
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
}

const DEFAULT_PREFERENCES: Preferences = { weightUnit: 'lb', heightUnit: 'ft_in' };

interface PreferencesContextValue extends Preferences {
  updatePreferences: (patch: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function parseStoredPreferences(raw: string | null): Preferences {
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PREFERENCES;
    const candidate = parsed as Partial<Record<keyof Preferences, unknown>>;
    return {
      weightUnit: candidate.weightUnit === 'kg' || candidate.weightUnit === 'lb' ? candidate.weightUnit : DEFAULT_PREFERENCES.weightUnit,
      heightUnit: candidate.heightUnit === 'cm' || candidate.heightUnit === 'ft_in' ? candidate.heightUnit : DEFAULT_PREFERENCES.heightUnit,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!cancelled) setPreferences(parseStoredPreferences(raw));
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)).catch(() => {
      // Non-fatal: preferences just won't persist across restarts.
    });
  }, [preferences, hydrated]);

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferences((current) => ({ ...current, ...patch }));
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({ ...preferences, updatePreferences }),
    [preferences, updatePreferences]
  );

  if (!hydrated) return null;

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return ctx;
}
