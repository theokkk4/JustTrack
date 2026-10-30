import { pickedLabels, titleCase, type BuilderConfig, type BuilderOption, type Selection } from './types';

const one = (id: string, label: string, itemId: string, doubleable = false): BuilderOption => ({ id, label, items: [{ id: itemId, qty: 1 }], doubleable });

/** Subway lists everything for a 6-inch; a footlong is two of each. */
export const subway: BuilderConfig = {
  key: 'subway',
  chain: 'Subway',
  title: 'Build your Subway',
  footnote: 'Subway’s published nutrition per 6-inch portion of each ingredient, doubled for a footlong.',
  defaultSelection: { 'six-inch': 1, italian: 1, turkey: 1, lettuce: 1, tomatoes: 1 },
  steps: [
    { id: 'size', title: 'Size', mode: 'one', multipliers: { 'six-inch': 1, footlong: 2 }, options: [{ id: 'six-inch', label: '6-inch', items: [] }, { id: 'footlong', label: 'Footlong', items: [] }] },
    {
      id: 'bread',
      title: 'Bread',
      mode: 'one',
      options: [
        one('italian', 'Artisan Italian', '68267050'),
        one('multigrain', 'Hearty Multigrain', '68267057'),
        one('jalapeno-cheddar', 'Jalapeño Cheddar', '68267062'),
        one('flatbread', 'Artisan Flatbread', '122317015'),
        { id: 'wrap', label: 'Wrap', items: [{ id: '122317020', qty: 1 }], fixed: true },
        { id: 'no-bread', label: 'No bread (bowl)', items: [] },
      ],
    },
    {
      id: 'protein',
      title: 'Protein',
      hint: 'Tap 2× for double.',
      mode: 'many',
      options: [
        one('turkey', 'Oven-Roasted Turkey', '68267665', true),
        one('ham', 'Black Forest Ham', '68267591', true),
        one('roast-beef', 'Roast Beef', '77978', true),
        one('grilled-chicken', 'Grilled Chicken', '68267633', true),
        one('rotisserie', 'Rotisserie-Style Chicken', '13927349', true),
        one('steak', 'Steak', '68267715', true),
        one('tuna', 'Tuna', '22316125', true),
        one('meatballs', 'Meatballs', '68267663', true),
        one('cold-cut', 'Cold Cut Combo', '3977181', true),
        one('club', 'Subway Club (turkey, ham, roast beef)', '83543359', true),
        one('all-american', 'All-American Club', '83543226', true),
        one('pastrami', 'Pastrami', '68267667', true),
        one('salami', 'Genoa Salami', '83543263', true),
        one('pepperoni', 'Pepperoni', '83543264', true),
        one('bacon', 'Bacon', '83543232', true),
        one('egg', 'Egg Patty', '83543253', true),
        one('veggie-patty', 'Veggie Patty', '4080286', true),
        one('buffalo-chicken', 'Buffalo Chicken', '68267636', true),
        one('teriyaki-chicken', 'Sweet Onion Teriyaki Chicken', '68267648', true),
      ],
    },
    {
      id: 'cheese',
      title: 'Cheese',
      mode: 'many',
      options: [one('american', 'American', '104299862', true), one('provolone', 'Provolone', '68267580', true), one('pepper-jack', 'Pepper Jack', '83543196', true), one('cheddar', 'Monterey Cheddar', '68267561', true), one('parmesan', 'Parmesan', '68267573')],
    },
    {
      id: 'veggies',
      title: 'Veggies',
      hint: 'All free, all day.',
      mode: 'many',
      options: [
        one('lettuce', 'Lettuce', '68267519'),
        one('tomatoes', 'Tomatoes', '83543177'),
        one('cucumbers', 'Cucumbers', '83543132'),
        one('green-peppers', 'Green peppers', '83543146'),
        one('onions', 'Onions', '727203'),
        one('spinach', 'Spinach', '68267551'),
        one('pickles', 'Pickles', '83543172'),
        one('olives', 'Black olives', '83543165'),
        one('banana-peppers', 'Banana peppers', '83543129'),
        one('jalapenos', 'Jalapeños', '83543154'),
        one('avocado', 'Smashed avocado', '68267280'),
        one('green-chiles', 'Green chiles', '68267285'),
      ],
    },
    {
      id: 'sauces',
      title: 'Sauces',
      mode: 'many',
      options: [
        one('mayo', 'Mayonnaise', '122317074'),
        one('mustard', 'Yellow mustard', '122317075'),
        one('honey-mustard', 'Honey mustard', '122317064'),
        one('teriyaki', 'Sweet onion teriyaki', '122317108'),
        one('baja-chipotle', 'Baja chipotle', '122317028'),
        one('ranch', 'Peppercorn ranch', '122317092'),
        one('buffalo', 'Buffalo', '122317047'),
        one('sriracha', 'Creamy sriracha', '122317042'),
        one('bbq', 'BBQ', '122317033'),
        one('garlic-aioli', 'Roasted garlic aioli', '122317098'),
        one('oil-vinegar', 'Oil & vinegar', '122317086'),
        one('red-wine-vinegar', 'Red wine vinegar', '122317097'),
        one('hot-honey', 'Hot honey', '122317071'),
        one('mvp-vinaigrette', 'MVP parmesan vinaigrette', '122317088'),
        one('cheese-sauce', 'Cheddar cheese sauce', '122317035'),
        one('subkrunch', 'Subkrunch', '122317104'),
        one('giardiniera', 'Giardiniera', '122317057'),
      ],
    },
    {
      id: 'extras',
      title: 'On the side',
      mode: 'many',
      unscaled: true,
      options: [
        one('cookie-chocolate-chip', 'Chocolate chip cookie', '83543369'),
        one('cookie-double', 'Double chocolate cookie', '69929381'),
        one('cookie-oatmeal', 'Oatmeal raisin cookie', '83543671'),
        one('cookie-macadamia', 'White chip macadamia cookie', '83543774'),
        one('cookie-cheesecake', 'Raspberry cheesecake cookie', '104299884'),
        one('soup-broccoli', 'Broccoli cheddar soup', '104299952'),
        one('soup-chicken', 'Chicken noodle soup', '104299964'),
        one('soup-potato', 'Loaded baked potato soup', '104299971'),
        one('applesauce', 'Applesauce', '68267810'),
        one('hash-browns', 'Hash browns', '68267817'),
      ],
    },
  ],
  nameOf(selection: Selection) {
    const size = selection.footlong ? 'Footlong' : '6-inch';
    const bread = this.steps[1].options.find((option) => selection[option.id]);
    const proteins = pickedLabels(this, selection, 'protein').map((label) => titleCase(label.replace(/ \(.*\)$/, '')));
    const what = proteins.length > 0 ? proteins.join(' & ') : 'Veggie';
    if (!bread || bread.id === 'no-bread') return `${what} Protein Bowl`;
    if (bread.id === 'wrap') return `${what} Wrap`;
    return `${size} ${what} on ${bread.label}`;
  },
  describe(selection: Selection) {
    return ['cheese', 'veggies', 'sauces', 'extras'].flatMap((step) => pickedLabels(this, selection, step)).join(', ');
  },
};
