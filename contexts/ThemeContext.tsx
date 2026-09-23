import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme as useSystemColorScheme } from 'react-native';

import { Colors, Shadows, type ColorScheme, type ThemeColors } from '@/constants/theme';
import type { ThemePreference } from '@/types';

const STORAGE_KEY = 'justtrack.themePreference';

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  scheme: ColorScheme;
  isDark: boolean;
  colors: ThemeColors;
  shadows: (typeof Shadows)[ColorScheme];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
          if (stored !== 'system') {
            Appearance.setColorScheme(stored);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    Appearance.setColorScheme(next === 'system' ? 'unspecified' : next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Non-fatal: preference just won't persist across restarts.
    });
  }, []);

  const scheme: ColorScheme = (preference === 'system' ? systemScheme : preference) === 'dark' ? 'dark' : 'light';

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      scheme,
      isDark: scheme === 'dark',
      colors: Colors[scheme],
      shadows: Shadows[scheme],
    }),
    [preference, setPreference, scheme]
  );

  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return ctx;
}
