import type { BuilderConfig, Selection } from './types';

/**
 * How an order looks while it's being built: the shape it comes in and the
 * ingredients that go into it, guessed from the option labels so every
 * builder gets a picture without hand-mapping its menu.
 */

export type Shape = 'bowl' | 'wrap' | 'tacos' | 'sub' | 'plate';

export type IngredientStyle = 'bed' | 'chunks' | 'dots' | 'shreds' | 'sheet' | 'drizzle' | 'slices';

export interface Ingredient {
  id: string;
  label: string;
  color: string;
  style: IngredientStyle;
  /** 1 or 2 (double). */
  count: number;
}

const RULES: [RegExp, { color: string; style: IngredientStyle }][] = [
  [/white rice|steamed rice/i, { color: '#F6F1E7', style: 'bed' }],
  [/brown rice|fried rice/i, { color: '#D9B47A', style: 'bed' }],
  [/chow mein|noodle/i, { color: '#E2B24E', style: 'shreds' }],
  [/super greens|spinach|kale|lettuce|romaine|greens/i, { color: '#6CC46E', style: 'shreds' }],
  [/black bean/i, { color: '#3B2A2F', style: 'dots' }],
  [/pinto bean|bean/i, { color: '#A3684A', style: 'dots' }],
  [/guac|avocado/i, { color: '#8FD05A', style: 'slices' }],
  [/queso|cheese sauce|nacho/i, { color: '#FFD166', style: 'drizzle' }],
  [/provolone|american|pepper ?jack|swiss|cheddar slice|cheese slice/i, { color: '#FFD86B', style: 'sheet' }],
  [/cheese|cheddar|parmesan/i, { color: '#FFD86B', style: 'shreds' }],
  [/sour cream|mayo|ranch|aioli|mustard|sriracha|vinaigrette|teriyaki|bbq|buffalo|honey|sauce|oil|vinegar|chimichurri|chili/i, { color: '#FFF4D6', style: 'drizzle' }],
  [/tomato|salsa|red|pico/i, { color: '#E8453C', style: 'dots' }],
  [/bacon/i, { color: '#9C3B2E', style: 'slices' }],
  [/corn/i, { color: '#F5C64A', style: 'dots' }],
  [/green chil|tomatillo|jalape|pepper|pickle|cucumber|olive/i, { color: '#5B9E4A', style: 'slices' }],
  [/onion/i, { color: '#E9D5F0', style: 'slices' }],
  [/fajita|veggie/i, { color: '#C94C4C', style: 'slices' }],
  [/shrimp|fish/i, { color: '#F7A58C', style: 'chunks' }],
  [/\begg\b/i, { color: '#F8D978', style: 'sheet' }],
  [/chicken|turkey|pollo|al pastor|carnitas|pork|tuna|egg|sofritas|tofu|patty|club/i, { color: '#C98A4B', style: 'chunks' }],
  [/steak|beef|brisket|barbacoa|carne|roast|pastrami|salami|pepperoni|meatball|sausage|bacon|ham|cold cut/i, { color: '#7A3E2E', style: 'chunks' }],
  [/tortilla|bread|wrap|flatbread|sub\b|roll/i, { color: '#E7C38A', style: 'bed' }],
];

export function ingredientFor(id: string, label: string, count: number): Ingredient | null {
  for (const [pattern, look] of RULES) {
    if (pattern.test(label)) return { id, label, count, ...look };
  }
  return null;
}

/** Steps whose picks go *in* the food; sides, drinks and sizes stay out of the picture. */
const SKIP_STEPS = /^(extras|chips|sweets|drink|appetizers|size|base|bread)$/;

/** What's inside a named sub, from its name: the meat it's named for, then Mike's Way where the menu serves it that way. */
const SUB_FILLINGS: [RegExp, string[]][] = [
  [/blt/i, ['bacon', 'lettuce', 'tomato']],
  [/porkroll|sausage/i, ['sausage', 'egg', 'cheese slice']],
  [/bacon, egg/i, ['bacon', 'egg', 'cheese slice']],
  [/egg/i, ['ham', 'egg', 'cheese slice']],
  [/tuna|chicken salad/i, ['tuna', 'lettuce', 'tomato', 'onion']],
  [/veggie/i, ['provolone', 'provolone', 'lettuce', 'tomato', 'onion', 'green pepper']],
  [/italian|stickball|cancro|super sub|jersey shore|number four|salami|pepperoni/i, ['ham', 'salami', 'provolone', 'lettuce', 'tomato', 'onion', 'vinegar']],
  [/philly|cheese ?steak|steak/i, ['steak', 'onion', 'green pepper', 'cheese slice']],
  [/buffalo chicken/i, ['chicken', 'buffalo sauce', 'lettuce', 'tomato', 'provolone']],
  [/chipotle turkey/i, ['turkey', 'chipotle sauce', 'lettuce', 'tomato', 'provolone']],
  [/club supreme|club sub|california club/i, ['turkey', 'ham', 'bacon', 'provolone', 'lettuce', 'tomato', 'mayo']],
  [/roast beef/i, ['roast beef', 'provolone', 'lettuce', 'tomato', 'onion']],
  [/turkey/i, ['turkey', 'provolone', 'lettuce', 'tomato', 'onion']],
  [/ham/i, ['ham', 'provolone', 'lettuce', 'tomato', 'onion']],
  [/chicken/i, ['chicken', 'provolone', 'lettuce', 'tomato']],
];

export function subFillings(name: string): string[] {
  return SUB_FILLINGS.find(([pattern]) => pattern.test(name))?.[1] ?? ['ham', 'provolone', 'lettuce', 'tomato', 'onion'];
}

export function ingredientsOf(config: BuilderConfig, selection: Selection): Ingredient[] {
  const list: Ingredient[] = [];
  for (const step of config.steps) {
    if (SKIP_STEPS.test(step.id) || step.unscaled) continue;
    for (const option of step.options) {
      const count = selection[option.id] ?? 0;
      if (!count || /^no /i.test(option.label)) continue;
      if (step.id === 'sub') {
        // A named sub: draw what the menu puts in it.
        subFillings(option.label).forEach((filling, index) => {
          const ingredient = ingredientFor(`${option.id}-${index}`, filling, 1);
          if (ingredient) list.push(ingredient);
        });
        continue;
      }
      const ingredient = ingredientFor(option.id, option.label, count);
      if (ingredient) list.push(ingredient);
    }
  }
  // Beds at the bottom, then chunks, then the small stuff and sauces on top.
  const order: IngredientStyle[] = ['bed', 'chunks', 'sheet', 'slices', 'dots', 'shreds', 'drizzle'];
  return list.sort((a, b) => order.indexOf(a.style) - order.indexOf(b.style));
}

export function shapeOf(config: BuilderConfig, selection: Selection): Shape {
  const picked = (stepId: string) => config.steps.find((step) => step.id === stepId)?.options.find((option) => selection[option.id]);
  switch (config.key) {
    case 'chipotle': {
      const base = picked('base')?.id ?? 'bowl';
      return base === 'burrito' ? 'wrap' : base.startsWith('tacos') ? 'tacos' : 'bowl';
    }
    case 'subway': {
      const bread = picked('bread')?.id ?? 'italian';
      return bread === 'wrap' ? 'wrap' : bread === 'no-bread' ? 'bowl' : 'sub';
    }
    case 'panda':
      return 'plate';
    default: {
      const size = picked('size')?.id ?? 'regular';
      return size === 'wrap' ? 'wrap' : size === 'bowl' ? 'bowl' : 'sub';
    }
  }
}

/** Panda Express picks a 1:1 fixed shape; Jersey Mike's sizes change the sub's length. */
export function lengthOf(config: BuilderConfig, selection: Selection): number {
  const size = config.steps.find((step) => step.id === 'size')?.options.find((option) => selection[option.id])?.id;
  if (size === 'footlong' || size === 'giant') return 1;
  if (size === 'mini') return 0.6;
  return 0.8;
}
