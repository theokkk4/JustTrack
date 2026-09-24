import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { ActivityLevel, NutritionValues, Sex, WeightGoal } from '@/types';

/**
 * Answers collected before an account exists. Persisted so a user who has to
 * leave the app mid-flow (e.g. to confirm their email) comes back to a
 * prefilled form instead of starting over.
 */
export interface OnboardingDraft {
  sex: Sex | null;
  ageYears: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  weightGoal: WeightGoal | null;
  /** Targets as the user adjusted them on the plan screen. */
  goals: NutritionValues | null;
}

const EMPTY_DRAFT: OnboardingDraft = {
  sex: null,
  ageYears: null,
  heightCm: null,
  weightKg: null,
  activityLevel: null,
  weightGoal: null,
  goals: null,
};

const STORAGE_KEY = 'justtrack.onboardingDraft';

interface OnboardingContextValue {
  draft: OnboardingDraft;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
  clearDraft: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          setDraft({ ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<OnboardingDraft>) });
        } catch {
          // Corrupt draft: start fresh.
        }
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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft)).catch(() => {});
  }, [draft, hydrated]);

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const clearDraft = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo(() => ({ draft, updateDraft, clearDraft }), [draft, updateDraft, clearDraft]);

  if (!hydrated) return null;

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
