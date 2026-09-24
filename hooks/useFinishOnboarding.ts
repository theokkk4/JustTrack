import { useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding, type OnboardingDraft } from '@/contexts/OnboardingContext';
import { calculateNutritionTargets } from '@/lib/nutrition/calorieTarget';
import { completeOnboarding, fetchProfileBundle, type OnboardingSubmission } from '@/services/profileService';

export function isDraftComplete(draft: OnboardingDraft): boolean {
  return Boolean(draft.sex && draft.ageYears && draft.heightCm && draft.weightKg && draft.activityLevel && draft.weightGoal);
}

export function buildSubmission(draft: OnboardingDraft, now: Date): OnboardingSubmission {
  const { sex, ageYears, heightCm, weightKg, activityLevel, weightGoal } = draft;
  if (!sex || !ageYears || !heightCm || !weightKg || !activityLevel || !weightGoal) {
    throw new Error('Some onboarding answers are missing. Please go back and fill them in.');
  }
  return {
    sex,
    birthYear: now.getFullYear() - ageYears,
    heightCm,
    weightKg,
    activityLevel,
    weightGoal,
    goals: draft.goals ?? calculateNutritionTargets({ sex, ageYears, heightCm, weightKg }, activityLevel, weightGoal),
  };
}

/**
 * Saves onboarding for a freshly signed-in user. If the account already
 * finished onboarding (a returning user who signed in at the last step),
 * their existing profile and goals are left untouched.
 */
export function useFinishOnboarding() {
  const { draft, clearDraft } = useOnboarding();
  const { refreshProfile } = useAuth();

  return useCallback(
    /** `overrides` covers answers set in the same tick, before the draft state has updated. */
    async (userId: string, overrides?: Partial<OnboardingDraft>) => {
      const existing = await fetchProfileBundle(userId);
      if (!existing.profile.onboardingCompletedAt) {
        await completeOnboarding(buildSubmission({ ...draft, ...overrides }, new Date()));
      }
      await refreshProfile();
      clearDraft();
    },
    [draft, clearDraft, refreshProfile]
  );
}
