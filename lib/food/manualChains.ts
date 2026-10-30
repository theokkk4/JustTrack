import type { ChainRow } from './chainDatabase';

/**
 * Chains that publish no nutrition facts. These are estimates from comparable
 * items (a hot chicken sandwich, six wings…) and say so in the serving label,
 * so the app shows them as estimates, never as the chain's own numbers.
 */
const EST = '1 serving (estimate)';

export const MANUAL_ROWS: readonly ChainRow[] = [
  ['hj-1', "Hangry Joe's", 'Chicken Sando', EST, 720, 38, 58, 38],
  ['hj-2', "Hangry Joe's", 'Jr. Sando', EST, 480, 24, 40, 24],
  ['hj-3', "Hangry Joe's", 'Chicken Fingers (3 pc)', EST, 540, 42, 30, 28],
  ['hj-4', "Hangry Joe's", 'Chicken Wings (6 pc)', EST, 600, 44, 18, 40],
  ['hj-5', "Hangry Joe's", 'Chicken & Waffles', EST, 950, 40, 92, 46],
  ['hj-6', "Hangry Joe's", 'Chicken Wrap', EST, 650, 36, 54, 32],
  ['hj-7', "Hangry Joe's", 'Loaded Fries', EST, 820, 24, 76, 48],
  ['hj-8', "Hangry Joe's", 'Chicken Salad', EST, 520, 36, 22, 32],
  ['hj-9', "Hangry Joe's", 'Loaded Mac & Cheese', EST, 780, 34, 66, 42],
];
