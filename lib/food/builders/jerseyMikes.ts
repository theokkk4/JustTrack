import { chainRows } from '@/lib/food/chainDatabase';
import { pickedLabels, type BuilderConfig, type BuilderOption, type Selection } from './types';

/**
 * Jersey Mike's lists each sub in every size, so the builder is: pick the
 * sub, pick the size, add chips, a cookie, a drink. The sub list is read
 * from the menu data itself, so new subs show up when the data is rebuilt.
 */

const CHAIN = "Jersey Mike's";
const SIZES = ['Mini', 'Regular', 'Giant', 'Wrap', 'Bowl'] as const;
type Size = (typeof SIZES)[number];
const SUB_PATTERN = /^(.+?) - (Mini|Regular|Giant|Wrap|Bowl)$/;

export interface Sub {
  id: string;
  name: string;
  /** Size → menu item id. */
  sizes: Partial<Record<Size, string>>;
}

let subsCache: Sub[] | null = null;

export function jerseyMikesSubs(): Sub[] {
  if (subsCache) return subsCache;
  const bySub = new Map<string, Sub>();
  for (const row of chainRows(CHAIN)) {
    const match = SUB_PATTERN.exec(row[2]);
    if (!match) continue;
    const name = match[1].trim();
    const sub = bySub.get(name) ?? { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, sizes: {} };
    sub.sizes[match[2] as Size] = row[0];
    bySub.set(name, sub);
  }
  // Numbered subs first, in menu order. Drinks also come in Regular/Giant; a sub is what also comes Mini.
  subsCache = [...bySub.values()]
    .filter((sub) => sub.sizes.Regular && sub.sizes.Mini)
    .sort((a, b) => {
      const an = /^#(\d+)/.exec(a.name)?.[1];
      const bn = /^#(\d+)/.exec(b.name)?.[1];
      if (an && bn) return Number(an) - Number(bn);
      if (an) return -1;
      if (bn) return 1;
      return a.name.localeCompare(b.name);
    });
  return subsCache;
}

function sideOptions(pattern: RegExp, exclude?: RegExp): BuilderOption[] {
  return chainRows(CHAIN)
    .filter((row) => pattern.test(row[2]) && !(exclude && exclude.test(row[2])) && !SUB_PATTERN.test(row[2]))
    .sort((a, b) => a[2].localeCompare(b[2]))
    .map((row) => ({ id: `item-${row[0]}`, label: row[2].replace(/ - Regular$/, ''), items: [{ id: row[0], qty: 1 }] }));
}

function drinkOptions(): BuilderOption[] {
  const subNames = new Set(jerseyMikesSubs().map((sub) => sub.name));
  return chainRows(CHAIN)
    .filter((row) => {
      const match = / - (Regular|20 oz)$/.exec(row[2]);
      return match && !subNames.has(row[2].slice(0, -match[0].length)) && !/cookie|brownie|chips|sub\b/i.test(row[2]);
    })
    .sort((a, b) => a[2].localeCompare(b[2]))
    .map((row) => ({ id: `item-${row[0]}`, label: row[2].replace(/ - (Regular|20 oz)$/, ''), items: [{ id: row[0], qty: 1 }] }));
}

let config: BuilderConfig | null = null;

export function jerseyMikes(): BuilderConfig {
  if (config) return config;
  const subs = jerseyMikesSubs();
  config = {
    key: 'jerseymikes',
    chain: CHAIN,
    title: "Build your Jersey Mike's",
    footnote: "Jersey Mike's published nutrition for each sub and size, made Mike's Way where the menu lists it that way.",
    defaultSelection: { [subs[0]?.id ?? 'sub']: 1, regular: 1 },
    steps: [
      { id: 'sub', title: 'Sub', mode: 'one', options: subs.map((sub) => ({ id: sub.id, label: sub.name, items: [] })) },
      { id: 'size', title: 'Size', mode: 'one', options: SIZES.map((size) => ({ id: size.toLowerCase(), label: size, items: [] })) },
      { id: 'chips', title: 'Chips', mode: 'many', unscaled: true, options: sideOptions(/lays|ruf|cheetos|doritos|sun ?chips|fritos|pretzel/i) },
      { id: 'sweets', title: 'Something sweet', mode: 'many', unscaled: true, options: sideOptions(/cookie|brownie|krimpet|kake|cupcake/i, /pack$/i) },
      { id: 'drink', title: 'Drink', mode: 'one', unscaled: true, options: [{ id: 'no-drink', label: 'No drink', items: [] }, ...drinkOptions()] },
    ],
    itemsOf(selection: Selection) {
      const items: { id: string; qty: number }[] = [];
      const sub = subs.find((candidate) => selection[candidate.id]);
      const size = SIZES.find((candidate) => selection[candidate.toLowerCase()]) ?? 'Regular';
      const subItem = sub?.sizes[size] ?? sub?.sizes.Regular;
      if (subItem) items.push({ id: subItem, qty: 1 });
      for (const step of this.steps.slice(2)) {
        for (const option of step.options) {
          if (selection[option.id]) option.items.forEach((item) => items.push({ id: item.id, qty: item.qty * (selection[option.id] ?? 1) }));
        }
      }
      return items;
    },
    nameOf(selection: Selection) {
      const sub = subs.find((candidate) => selection[candidate.id]);
      const size = SIZES.find((candidate) => selection[candidate.toLowerCase()]) ?? 'Regular';
      return sub ? `${size} ${sub.name}` : 'Jersey Mike’s sub';
    },
    describe(selection: Selection) {
      return ['chips', 'sweets', 'drink'].flatMap((step) => pickedLabels(this, selection, step)).filter((label) => label !== 'no drink').join(', ');
    },
  };
  return config;
}
