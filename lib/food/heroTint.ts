/**
 * Most foods have no photo, so their hero gets a gradient that hints at
 * what they are: peach for fruit, green for vegetables, amber for grains…
 */

export type HeroTint = readonly [string, string];

const TINTS: { pattern: RegExp; tint: HeroTint }[] = [
  { pattern: /pizza|burger|sandwich|taco|burrito|fries|fast food|hot dog|wrap/i, tint: ['#F28A4D', '#FFD0A3'] },
  { pattern: /fruit|berry|berries|apple|banana|orange|grape|melon|mango|peach|pear|citrus|juice/i, tint: ['#FF8F5E', '#FFD1A1'] },
  { pattern: /vegetable|salad|greens|lettuce|broccoli|spinach|carrot|pepper|tomato|bean|pea|legume|avocado/i, tint: ['#4FB37A', '#BDE7C3'] },
  { pattern: /bread|grain|rice|pasta|noodle|cereal|oat|bagel|tortilla|cracker|pancake|waffle|muffin/i, tint: ['#D9A441', '#F4DFA4'] },
  { pattern: /milk|yogurt|cheese|dairy|ice cream|cream|butter/i, tint: ['#7FA9F2', '#D5E4FF'] },
  { pattern: /chicken|beef|pork|turkey|lamb|fish|seafood|shrimp|salmon|tuna|egg|meat|steak|bacon|sausage|protein/i, tint: ['#E86E8B', '#FFC2D0'] },
  { pattern: /candy|cookie|cake|dessert|chocolate|sweet|donut|pastry|pie|brownie|sugar/i, tint: ['#B57BFF', '#EBD8FF'] },
  { pattern: /coffee|tea|soda|drink|beverage|water|smoothie|shake|beer|wine|latte|energy/i, tint: ['#5BB7D0', '#CBEEF6'] },
  { pattern: /soup|stew|chili|curry/i, tint: ['#D97A4A', '#F7C7A6'] },
  { pattern: /nut|seed|peanut|almond|granola|bar/i, tint: ['#B98A5A', '#EAD3B5'] },
];

export const DEFAULT_TINT: HeroTint = ['#5A3BF4', '#A98EFF'];

/** Picks a tint from the food's category and name. */
export function heroTintFor(...descriptions: (string | null | undefined)[]): HeroTint {
  const text = descriptions.filter(Boolean).join(' ');
  return TINTS.find(({ pattern }) => pattern.test(text))?.tint ?? DEFAULT_TINT;
}
