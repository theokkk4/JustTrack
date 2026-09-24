import { MAX_AGE, MIN_AGE } from '@/constants/onboarding';
import type { HeightUnit, WeightUnit } from '@/types';
import { cmToFeetInches, feetInchesToCm, kgToLb, lbToKg } from '@/utils/units';

export interface BodyStatsInput {
  age: string;
  feet: string;
  inches: string;
  cm: string;
  weight: string;
}

export interface BodyStatsValues {
  ageYears: number;
  heightCm: number;
  weightKg: number;
}

export type BodyStatsErrors = Partial<Record<'age' | 'height' | 'weight', string>>;

type ParseResult = { ok: true; value: BodyStatsValues } | { ok: false; errors: BodyStatsErrors };

function toNumber(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Validates the "About you" form and converts it to canonical metric values. */
export function parseBodyStats(input: BodyStatsInput, units: { weightUnit: WeightUnit; heightUnit: HeightUnit }): ParseResult {
  const errors: BodyStatsErrors = {};

  const age = toNumber(input.age);
  if (age === null || !Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
    errors.age = `Enter an age between ${MIN_AGE} and ${MAX_AGE}.`;
  }

  let heightCm: number | null = null;
  if (units.heightUnit === 'cm') {
    const cm = toNumber(input.cm);
    if (cm !== null && cm >= 90 && cm <= 250) heightCm = cm;
    else errors.height = 'Enter a height between 90 and 250 cm.';
  } else {
    const feet = toNumber(input.feet);
    const inches = input.inches.trim() === '' ? 0 : toNumber(input.inches);
    if (feet !== null && inches !== null && Number.isInteger(feet) && feet >= 3 && feet <= 8 && inches >= 0 && inches < 12) {
      heightCm = feetInchesToCm(feet, inches);
    } else {
      errors.height = 'Enter a height between 3′ and 8′ 11″.';
    }
  }

  const weight = toNumber(input.weight);
  const weightKg = weight === null ? null : units.weightUnit === 'kg' ? weight : lbToKg(weight);
  if (weightKg === null || weightKg < 27 || weightKg > 320) {
    errors.weight = units.weightUnit === 'kg' ? 'Enter a weight between 27 and 320 kg.' : 'Enter a weight between 60 and 700 lb.';
  }

  if (Object.keys(errors).length > 0 || age === null || heightCm === null || weightKg === null) {
    return { ok: false, errors };
  }
  return { ok: true, value: { ageYears: age, heightCm, weightKg } };
}

/** Text to prefill a weight field from a stored kg value. */
export function weightInputFor(weightKg: number, unit: WeightUnit): string {
  const value = unit === 'kg' ? weightKg : kgToLb(weightKg);
  return String(Math.round(value * 10) / 10);
}

/** Text to prefill height fields from a stored cm value. */
export function heightInputsFor(heightCm: number): Pick<BodyStatsInput, 'feet' | 'inches' | 'cm'> {
  const { feet, inches } = cmToFeetInches(heightCm);
  return { feet: String(feet), inches: String(inches), cm: String(Math.round(heightCm)) };
}

type HeightInputs = Pick<BodyStatsInput, 'feet' | 'inches' | 'cm'>;

/** Carries whatever height was typed over to the other unit's fields. */
export function convertHeightInputs(inputs: HeightInputs, to: HeightUnit): HeightInputs {
  if (to === 'cm') {
    const feet = toNumber(inputs.feet);
    const inches = inputs.inches.trim() === '' ? 0 : toNumber(inputs.inches);
    return feet === null || inches === null ? inputs : { ...inputs, cm: String(Math.round(feetInchesToCm(feet, inches))) };
  }
  const cm = toNumber(inputs.cm);
  return cm === null ? inputs : heightInputsFor(cm);
}

/** Carries a typed weight over to the other unit. */
export function convertWeightInput(value: string, from: WeightUnit, to: WeightUnit): string {
  const amount = toNumber(value);
  if (amount === null || from === to) return value;
  return weightInputFor(from === 'kg' ? amount : lbToKg(amount), to);
}
