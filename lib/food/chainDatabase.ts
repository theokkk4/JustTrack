import type { FoodDetail } from '@/types';
import { rankEntries, scoreEntry, toSearchEntry, tokenize, type SearchEntry } from './search';

/**
 * The menus of America's biggest fast-food chains, bundled so searching them
 * is instant and the photo scanner can snap a recognized item to its real
 * menu nutrition. Built by scripts/build-chain-foods.js from FatSecret.
 */

/** [id, chain, name, serving label, kcal, protein, carbs, fat] — nutrition is per the serving as the chain lists it. */
export type ChainRow = [string, string, string, string, number, number, number, number];

interface Indexed {
  row: ChainRow;
  entry: SearchEntry;
  chainWords: string[];
}

let index: Indexed[] | null = null;
let byId: Map<string, ChainRow> | null = null;
let chains: string[] = [];

function load(): Indexed[] {
  if (!index) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require('@/assets/data/chain-foods.json') as { rows: ChainRow[] };
    index = data.rows.map((row) => ({ row, entry: toSearchEntry(row[2]), chainWords: tokenize(row[1]) }));
    byId = new Map(data.rows.map((row) => [row[0], row]));
    chains = [...new Set(data.rows.map((row) => row[1]))];
  }
  return index;
}

/** Other ways people write a chain's name, so "cfa spicy sandwich" and "dunkin donuts latte" work. */
const ALIASES: Record<string, string[]> = {
  "McDonald's": ['mcdonalds', 'mcdonald', 'mcd', 'mickey', 'maccas'],
  'Chick-fil-A': ['chickfila', 'chick', 'fil', 'cfa'],
  "Dunkin'": ['dunkin', 'dunkins', 'dd'],
  "Wendy's": ['wendys', 'wendy'],
  'Chipotle Mexican Grill': ['chipotle'],
  'Burger King': ['bk'],
  "Domino's": ['dominos', 'domino'],
  'Panera Bread': ['panera'],
  'Popeyes': ['popeye'],
  "Raising Cane's": ['canes', 'cane', 'raising'],
  'Sonic Drive-In': ['sonic'],
  'Dairy Queen': ['dq'],
  'KFC': ['kentucky'],
  "Jersey Mike's": ['jersey', 'mikes', 'mike'],
  'Taco Bell': ['tacobell'],
  'Pizza Hut': ['pizzahut'],
  'Panda Express': ['panda'],
};

export function chainNames(): string[] {
  load();
  return chains;
}

/** The chain a query or label names, and the words left over once it's removed. */
export function detectChain(text: string): { chain: string | null; rest: string[] } {
  const words = tokenize(text);
  for (const chain of chainNames()) {
    const own = tokenize(chain);
    const aliases = (ALIASES[chain] ?? []).map((alias) => tokenize(alias)[0] ?? alias);
    const hits = new Set<string>();
    for (const word of words) {
      if (own.includes(word) || aliases.includes(word)) hits.add(word);
    }
    // The full name, or any alias, names the chain; "bell" or "king" alone doesn't.
    const named = own.every((word) => hits.has(word)) || words.some((word) => aliases.includes(word));
    if (named) return { chain, rest: words.filter((word) => !hits.has(word)) };
  }
  return { chain: null, rest: words };
}

/** Words that pick a size or count; a guess of "medium" must not land on the large. */
const SIZE_WORDS = new Set(['small', 'medium', 'large', 'regular', 'kid', 'kids', 'mini', 'junior', 'jr', 'tall', 'grande', 'venti', 'trenta', 'short', 'half', 'whole', 'single', 'double', 'triple', 'footlong', '6', '4', '5', '8', '10', '12', '20', '30']);
const sizeWords = (words: readonly string[]) => words.filter((word) => SIZE_WORDS.has(word));

const round1 = (value: number) => Math.round(value * 10) / 10;

export function chainRowToFood(row: ChainRow): FoodDetail {
  const [id, chain, name, serving, kcal, protein, carbs, fat] = row;
  return {
    id: `chain:${id}`,
    source: 'chain',
    externalId: id,
    name,
    brand: chain,
    category: 'Restaurant',
    servings: [{ id: 'serving', description: serving, metricAmount: null, metricUnit: null, isDefault: true, calories: round1(kcal), protein: round1(protein), carbs: round1(carbs), fat: round1(fat) }],
  };
}

/**
 * Searches the menus. Naming a chain narrows the results to it ("chipotle bowl");
 * otherwise every chain's items compete on the name alone.
 */
export function searchChainFoods(query: string, limit = 25): FoodDetail[] {
  const items = load();
  const { chain, rest } = detectChain(query);
  const pool = chain ? items.filter((item) => item.row[1] === chain) : items;
  if (rest.length === 0) {
    return chain ? pool.slice(0, limit).map((item) => chainRowToFood(item.row)) : [];
  }
  const strict = rankEntries(rest.join(' '), pool, (item) => item.entry, limit);
  // Menus name things their own way ("Chicken Bowl", not "chicken burrito bowl"): on a named chain, fall back to the closest items.
  const results = strict.length > 0 || !chain ? strict : lenientRank(rest, pool, limit);
  return results.map((item) => chainRowToFood(item.row));
}

/** Items that cover most of the words, best coverage first — for when no item matches every word. */
function lenientRank(words: string[], pool: readonly Indexed[], limit: number): Indexed[] {
  const scored: { item: Indexed; score: number }[] = [];
  const wantedSizes = sizeWords(words);
  const content = words.filter((word) => !SIZE_WORDS.has(word));
  for (const item of pool) {
    const ownSizes = sizeWords(item.entry.words);
    // A different size is a different item; an unsized guess prefers the unsized (or smallest-listed) item.
    if (wantedSizes.length > 0 && ownSizes.length > 0 && !wantedSizes.some((size) => ownSizes.includes(size))) continue;
    const matched = content.filter((word) => item.entry.words.some((own) => own === word || (word.length >= 4 && own.startsWith(word))));
    if (matched.length === 0) continue;
    const coverage = matched.length / content.length;
    if (coverage < 0.5) continue;
    const precision = matched.length / Math.max(item.entry.words.length - ownSizes.length, 1);
    const exact = scoreEntry(content, item.entry);
    const sizeBonus = wantedSizes.length > 0 && wantedSizes.some((size) => ownSizes.includes(size)) ? 0.5 : wantedSizes.length === 0 && ownSizes.length > 0 ? -0.3 : 0;
    scored.push({ item, score: coverage * 2 + precision + (exact !== null ? 1 : 0) + sizeBonus });
  }
  scored.sort((a, b) => b.score - a.score || a.item.row[2].localeCompare(b.item.row[2]));
  return scored.slice(0, limit).map((entry) => entry.item);
}

/** Every menu row for a chain, in data order. */
export function chainRows(chain: string): ChainRow[] {
  return load().filter((item) => item.row[1] === chain).map((item) => item.row);
}

export function getChainFood(id: string): FoodDetail | null {
  load();
  const row = byId?.get(id);
  return row ? chainRowToFood(row) : null;
}

/**
 * The menu item the scanner most likely saw, when it recognized the chain:
 * the best name match that covers most of the model's words. Null when
 * nothing on that menu fits, so the estimate stands.
 */
export function matchChainItem(chain: string, name: string, portion = ''): FoodDetail | null {
  const items = load();
  const resolved = detectChain(chain).chain ?? chain;
  const pool = items.filter((item) => item.row[1] === resolved);
  // The portion's size words count too: the model says "Waffle Fries", "medium".
  const words = [...detectChain(name).rest.filter((word) => !tokenize(resolved).includes(word)), ...sizeWords(tokenize(portion))];
  if (pool.length === 0 || words.length === 0) return null;
  // As many of the model's words as fit, not all of them: "spicy chicken sandwich" should find "Spicy Chicken Sandwich".
  const [best] = lenientRank(words, pool, 1);
  return best ? chainRowToFood(best.row) : null;
}
