import { MAX_CALORIE_TARGET } from '@/constants/onboarding';
import { MIN_CALORIE_TARGET } from '@/lib/nutrition/calorieTarget';
import { createPersistedStore } from '@/lib/storage/persistedStore';
import type { MacroGoals, Settings } from '@/types';

export const DEFAULT_SETTINGS: Settings = {
  welcomed: false,
  displayName: null,
  calorieGoal: 2000,
  macroGoals: null,
  weightUnit: 'lb',
  heightUnit: 'ft_in',
};

function clampGoal(value: unknown): number {
  const goal = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : DEFAULT_SETTINGS.calorieGoal;
  return Math.min(Math.max(goal, MIN_CALORIE_TARGET), MAX_CALORIE_TARGET);
}

function parseMacroGoals(raw: unknown): MacroGoals | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { protein, carbs, fat } = raw as Record<string, unknown>;
  const ok = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 2000;
  return ok(protein) && ok(carbs) && ok(fat) ? { protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) } : null;
}

export function parseSettings(raw: unknown): Settings | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  return {
    welcomed: item.welcomed === true,
    displayName: typeof item.displayName === 'string' && item.displayName.trim() ? item.displayName.trim().slice(0, 40) : null,
    calorieGoal: clampGoal(item.calorieGoal),
    macroGoals: parseMacroGoals(item.macroGoals),
    weightUnit: item.weightUnit === 'kg' ? 'kg' : 'lb',
    heightUnit: item.heightUnit === 'cm' ? 'cm' : 'ft_in',
  };
}

export const settingsStore = createPersistedStore<Settings>('justtrack.settings.v1', DEFAULT_SETTINGS, parseSettings);

export function updateSettings(patch: Partial<Settings>): void {
  settingsStore.set((current) => ({ ...current, ...patch, calorieGoal: clampGoal(patch.calorieGoal ?? current.calorieGoal) }));
}
