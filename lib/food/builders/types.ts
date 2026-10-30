import { getChainFood } from '@/lib/food/chainDatabase';
import { sumNutrition } from '@/lib/nutrition/calculateNutrition';
import type { MealType, NewLogEntry, NutritionValues } from '@/types';

/**
 * Order builders: a chain's menu the way it's ordered at the counter —
 * pick a base, a protein, the toppings — with every option tied to real
 * menu items from the chain database, so the total is the menu added up.
 */

export interface BuilderOption {
  id: string;
  label: string;
  /** Menu items this option is made of, with how many of each. */
  items: { id: string; qty: number }[];
  /** "Double" is a real order; most toppings can't be doubled. */
  doubleable?: boolean;
  /** Not scaled by a size step (a wrap doesn't come footlong). */
  fixed?: boolean;
}

export interface BuilderStep {
  id: string;
  title: string;
  hint?: string;
  /** Pick one (radio) or any number (checkbox). */
  mode: 'one' | 'many';
  options: BuilderOption[];
  /** A size step: the chosen option's multiplier scales the other (non-fixed) items. */
  multipliers?: Record<string, number>;
  /** Items in this step aren't scaled by the size step (sides, drinks). */
  unscaled?: boolean;
}

/** Option id → how many (1 or 2). Absent means not picked. */
export type Selection = Record<string, number>;

export interface BuilderConfig {
  key: string;
  chain: string;
  title: string;
  footnote: string;
  steps: BuilderStep[];
  defaultSelection: Selection;
  /** "Chicken Bowl", "Footlong Turkey on Italian". */
  nameOf: (selection: Selection) => string;
  /** Everything else that went in, for the entry's detail line. */
  describe: (selection: Selection) => string;
  /** Override when the items aren't a plain union of the picked options' items. */
  itemsOf?: (selection: Selection) => { id: string; qty: number }[];
}

export function stepOf(config: BuilderConfig, optionId: string): BuilderStep | null {
  return config.steps.find((step) => step.options.some((option) => option.id === optionId)) ?? null;
}

export function optionOf(config: BuilderConfig, optionId: string): BuilderOption | null {
  return stepOf(config, optionId)?.options.find((option) => option.id === optionId) ?? null;
}

/** The multiplier the picked size applies, or 1. */
export function sizeMultiplier(config: BuilderConfig, selection: Selection): number {
  for (const step of config.steps) {
    if (!step.multipliers) continue;
    const picked = step.options.find((option) => selection[option.id]);
    if (picked) return step.multipliers[picked.id] ?? 1;
  }
  return 1;
}

export function itemsOf(config: BuilderConfig, selection: Selection): { id: string; qty: number }[] {
  if (config.itemsOf) return config.itemsOf(selection);
  const scale = sizeMultiplier(config, selection);
  const items: { id: string; qty: number }[] = [];
  for (const [optionId, count] of Object.entries(selection)) {
    const step = stepOf(config, optionId);
    const option = optionOf(config, optionId);
    if (!step || !option || !count) continue;
    const factor = step.unscaled || option.fixed ? 1 : scale;
    option.items.forEach((item) => items.push({ id: item.id, qty: item.qty * count * factor }));
  }
  return items;
}

export function nutritionOf(config: BuilderConfig, selection: Selection): NutritionValues {
  const parts: NutritionValues[] = [];
  for (const { id, qty } of itemsOf(config, selection)) {
    const serving = getChainFood(id)?.servings[0];
    if (!serving) continue;
    parts.push({ calories: serving.calories * qty, protein: serving.protein * qty, carbs: serving.carbs * qty, fat: serving.fat * qty });
  }
  return sumNutrition(parts);
}

/** Toggle an option: pick it or clear it. One-of steps swap instead. Doubling is setCount's job. */
export function toggle(selection: Selection, step: BuilderStep, option: BuilderOption): Selection {
  const current = selection[option.id] ?? 0;
  const next = { ...selection };
  if (step.mode === 'one') {
    step.options.forEach((other) => delete next[other.id]);
    next[option.id] = current || 1;
    return next;
  }
  if (current === 0) next[option.id] = 1;
  else delete next[option.id];
  return next;
}

/** Single or double of a picked option ("Double chicken" is a real order). */
export function setCount(selection: Selection, option: BuilderOption, count: 1 | 2): Selection {
  if (!selection[option.id]) return selection;
  return { ...selection, [option.id]: option.doubleable ? count : 1 };
}

/** The picked options of a step, as lowercase labels ("double steak", "cheese"). */
export function pickedLabels(config: BuilderConfig, selection: Selection, stepId: string): string[] {
  const step = config.steps.find((candidate) => candidate.id === stepId);
  if (!step) return [];
  return step.options.filter((option) => selection[option.id]).map((option) => (selection[option.id] === 2 ? `double ${option.label.toLowerCase()}` : option.label.toLowerCase()));
}

export const titleCase = (text: string) => text.replace(/\b\w/g, (c) => c.toUpperCase());

const round1 = (value: number) => Math.round(value * 10) / 10;

export function entryOf(config: BuilderConfig, selection: Selection, mealType: MealType): NewLogEntry {
  const nutrition = nutritionOf(config, selection);
  const extras = config.describe(selection);
  return {
    mealType,
    source: 'chain',
    externalFoodId: null,
    externalServingId: null,
    foodName: extras ? `${config.nameOf(selection)} · ${extras}` : config.nameOf(selection),
    brand: config.chain,
    servings: 1,
    amountUnit: 'serving',
    grams: 0,
    isEstimate: false,
    imageUri: null,
    calories: round1(nutrition.calories),
    protein: round1(nutrition.protein),
    carbs: round1(nutrition.carbs),
    fat: round1(nutrition.fat),
  };
}
