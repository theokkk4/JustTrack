/**
 * Chains' menus come to us as flat lists. These rules sort items into the
 * sections a menu board would have, so a chain's page reads like one.
 * First matching rule wins; anything else lands in "Menu".
 */

const RULES: readonly [group: string, pattern: RegExp][] = [
  ['Kids', /\b(kids?|happy meal|kid'?s)\b/i],
  ['Breakfast', /\b(breakfast|egg|hash ?brown|mcmuffin|biscuit|bagel|croissant|pancake|waffle|oatmeal|burrito.*egg|sausage.*(muffin|biscuit))\b/i],
  ['Drinks', /\b(coffee|latte|cappuccino|espresso|macchiato|americano|mocha|frappuccino|refresher|tea|lemonade|soda|coke|cola|pepsi|sprite|dr\.? pepper|root beer|fanta|juice|milk|smoothie|shake|slush|frozen|iced|cold brew|hot chocolate|water|drink|beverage|float|limeade|punch|dasani|powerade|gatorade|fl oz|oz\))/i],
  ['Desserts', /\b(cookie|brownie|cake|pie|sundae|cone|blizzard|dessert|ice cream|donut|doughnut|munchkin|cinnamon|churro|pastry|muffin|scone|cheesecake|parfait|cupcake|mcflurry|frosty|dipped|treat|sweet|candy|brookie)\b/i],
  ['Pizza', /\b(pizza|calzone|stuffed crust|pan|thin crust|slice)\b/i],
  ['Wings', /\b(wings?|boneless|tenders?|nuggets?|strips?|fingers?|popcorn chicken|bites)\b/i],
  ['Burgers', /\b(burger|cheeseburger|whopper|big mac|quarter pounder|mcdouble|baconator|dave'?s|patty|hamburger|slider)\b/i],
  ['Sandwiches', /\b(sandwich|sub|footlong|hoagie|wrap|melt|club|hero|roast beef|panini|flatbread|ciabatta|baguette|gyro|sloppy)\b/i],
  ['Tacos & Burritos', /\b(taco|burrito|quesadilla|chalupa|gordita|nacho|crunchwrap|enchilada|tostada|fajita)\b/i],
  ['Bowls & Salads', /\b(bowl|salad|greens|lifestyle|protein plate)\b/i],
  ['Entrees', /\b(chicken|beef|shrimp|steak|pork|fish|fillet|filet|combo|plate|meal|dinner|rice|noodle|chow mein|orange|teriyaki|kung pao|broccoli)\b/i],
  ['Sides', /\b(fries?|side|tots|onion rings|coleslaw|slaw|mac|cheese curds|mozzarella|breadstick|garlic knots|chips|corn|beans|mashed|potato|cup of|dip|sauce|dressing|toast|crackers|apple slices|fruit)\b/i],
  ['Soups', /\b(soup|chili|broth|bisque|chowder)\b/i],
];

export const GROUP_ORDER: readonly string[] = ['Burgers', 'Sandwiches', 'Tacos & Burritos', 'Pizza', 'Wings', 'Entrees', 'Bowls & Salads', 'Breakfast', 'Soups', 'Sides', 'Desserts', 'Drinks', 'Kids', 'Menu'];

export function menuGroupFor(name: string): string {
  for (const [group, pattern] of RULES) {
    if (pattern.test(name)) return group;
  }
  return 'Menu';
}

export interface MenuGroup<T> {
  title: string;
  data: T[];
}

/** Splits a menu into ordered sections; empty sections are left out, items are A–Z inside each. */
export function groupMenu<T>(items: readonly T[], nameOf: (item: T) => string): MenuGroup<T>[] {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const group = menuGroupFor(nameOf(item));
    const list = buckets.get(group) ?? [];
    list.push(item);
    buckets.set(group, list);
  }
  return GROUP_ORDER.filter((group) => buckets.has(group)).map((group) => ({
    title: group,
    data: [...(buckets.get(group) ?? [])].sort((a, b) => nameOf(a).localeCompare(nameOf(b))),
  }));
}

const GROUP_EMOJI: Record<string, string> = {
  Burgers: '🍔',
  Sandwiches: '🥪',
  'Tacos & Burritos': '🌮',
  Pizza: '🍕',
  Wings: '🍗',
  Entrees: '🍽️',
  'Bowls & Salads': '🥗',
  Breakfast: '🍳',
  Soups: '🍲',
  Sides: '🍟',
  Desserts: '🍰',
  Drinks: '🥤',
  Kids: '🧒',
  Menu: '📋',
  Results: '🔎',
};

export function groupEmoji(title: string): string {
  return GROUP_EMOJI[title] ?? '🍽️';
}
