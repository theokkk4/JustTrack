import { supabase } from '@/lib/supabase/client';
import type { ActivityLevel, NutritionGoals, NutritionValues, Profile, Sex, WeightGoal } from '@/types';
import type { Tables } from '@/types/database';

const SEXES: readonly Sex[] = ['male', 'female', 'unspecified'];
const ACTIVITY_LEVELS: readonly ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const WEIGHT_GOALS: readonly WeightGoal[] = ['lose', 'maintain', 'gain'];

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function mapProfileRow(row: Tables<'profiles'>): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    sex: oneOf(row.sex, SEXES),
    birthYear: row.birth_year,
    heightCm: row.height_cm,
    activityLevel: oneOf(row.activity_level, ACTIVITY_LEVELS),
    weightGoal: oneOf(row.weight_goal, WEIGHT_GOALS),
    onboardingCompletedAt: row.onboarding_completed_at,
    createdAt: row.created_at,
  };
}

export function mapGoalsRow(row: Tables<'nutrition_goals'>): NutritionGoals {
  return {
    id: row.id,
    userId: row.user_id,
    calories: row.calorie_goal,
    protein: row.protein_goal,
    carbs: row.carbs_goal,
    fat: row.fat_goal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function emptyProfile(userId: string): Profile {
  return {
    id: userId,
    displayName: null,
    avatarUrl: null,
    sex: null,
    birthYear: null,
    heightCm: null,
    activityLevel: null,
    weightGoal: null,
    onboardingCompletedAt: null,
    createdAt: new Date().toISOString(),
  };
}

export interface ProfileBundle {
  profile: Profile;
  goals: NutritionGoals | null;
  latestWeightKg: number | null;
}

export async function fetchProfileBundle(userId: string): Promise<ProfileBundle> {
  const [profileResult, goalsResult, weightResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('nutrition_goals').select('*').eq('user_id', userId).maybeSingle(),
    supabase
      .from('weight_entries')
      .select('weight_kg')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (goalsResult.error) throw goalsResult.error;
  if (weightResult.error) throw weightResult.error;

  return {
    // The signup trigger creates the row; if it's somehow missing, onboarding's upsert recreates it.
    profile: profileResult.data ? mapProfileRow(profileResult.data) : emptyProfile(userId),
    goals: goalsResult.data ? mapGoalsRow(goalsResult.data) : null,
    latestWeightKg: weightResult.data?.weight_kg ?? null,
  };
}

export interface OnboardingSubmission {
  sex: Sex;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  weightGoal: WeightGoal;
  goals: NutritionValues;
  displayName?: string | null;
}

/** Saves goals, first weigh-in, and profile atomically (see the complete_onboarding migration). */
export async function completeOnboarding(input: OnboardingSubmission): Promise<void> {
  const { error } = await supabase.rpc('complete_onboarding', {
    p_sex: input.sex,
    p_birth_year: input.birthYear,
    p_height_cm: Math.round(input.heightCm * 10) / 10,
    p_weight_kg: Math.round(input.weightKg * 100) / 100,
    p_activity_level: input.activityLevel,
    p_weight_goal: input.weightGoal,
    p_calorie_goal: Math.round(input.goals.calories),
    p_protein_goal: Math.round(input.goals.protein),
    p_carbs_goal: Math.round(input.goals.carbs),
    p_fat_goal: Math.round(input.goals.fat),
    p_display_name: input.displayName ?? undefined,
  });
  if (error) throw error;
}

export async function saveNutritionGoals(userId: string, goals: NutritionValues): Promise<NutritionGoals> {
  const { data, error } = await supabase
    .from('nutrition_goals')
    .upsert(
      {
        user_id: userId,
        calorie_goal: Math.round(goals.calories),
        protein_goal: Math.round(goals.protein),
        carbs_goal: Math.round(goals.carbs),
        fat_goal: Math.round(goals.fat),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return mapGoalsRow(data);
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim().slice(0, 80) || null })
    .eq('id', userId);
  if (error) throw error;
}
