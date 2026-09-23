import type { HeightUnit, WeightUnit } from '@/types';

/**
 * Everything is stored metric (kg, cm); these convert only at the UI edge
 * so there's exactly one canonical value in the database.
 */

const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function inchesToCm(inches: number): number {
  return inches * CM_PER_INCH;
}

export function cmToInches(cm: number): number {
  return cm / CM_PER_INCH;
}

export function feetInchesToCm(feet: number, inches: number): number {
  return inchesToCm(feet * 12 + inches);
}

/** Splits a height into whole feet and whole inches, carrying 12" up so we never show 5'12". */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cmToInches(cm));
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return unit === 'kg' ? `${(Math.round(kg * 10) / 10).toFixed(1)} kg` : `${(Math.round(kgToLb(kg) * 10) / 10).toFixed(1)} lb`;
}

export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === 'cm') return `${Math.round(cm)} cm`;
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}′ ${inches}″`;
}

export const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = { lb: 'Pounds (lb)', kg: 'Kilograms (kg)' };
export const HEIGHT_UNIT_LABELS: Record<HeightUnit, string> = { ft_in: 'Feet & inches', cm: 'Centimeters (cm)' };
