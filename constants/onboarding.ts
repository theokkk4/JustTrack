import type { ActivityLevel, Sex, WeightGoal } from '@/types';

export const SEX_OPTIONS: readonly { value: Sex; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'unspecified', label: 'Other' },
];

export const ACTIVITY_OPTIONS: readonly { value: ActivityLevel; title: string; description: string }[] = [
  { value: 'sedentary', title: 'Mostly sitting', description: 'Little or no exercise' },
  { value: 'light', title: 'Lightly active', description: 'Light exercise 1–3 days a week' },
  { value: 'moderate', title: 'Moderately active', description: 'Exercise 3–5 days a week' },
  { value: 'active', title: 'Very active', description: 'Hard exercise 6–7 days a week' },
  { value: 'very_active', title: 'Athlete', description: 'Training twice a day or a physical job' },
];

export const GOAL_OPTIONS: readonly { value: WeightGoal; title: string; description: string }[] = [
  { value: 'lose', title: 'Lose weight', description: 'About 1 lb (0.5 kg) a week' },
  { value: 'maintain', title: 'Maintain', description: 'Stay where you are' },
  { value: 'gain', title: 'Gain weight', description: 'Build muscle with a small surplus' },
];

export const MIN_AGE = 13;
export const MAX_AGE = 100;
export const CALORIE_STEP = 50;
export const MAX_CALORIE_TARGET = 6000;
