import { pickedLabels, titleCase, type BuilderConfig, type BuilderOption, type Selection } from './types';

const one = (id: string, label: string, itemId: string, doubleable = false): BuilderOption => ({ id, label, items: [{ id: itemId, qty: 1 }], doubleable });

/** The veggie option is fajita veggies plus guacamole at no charge, as Chipotle serves it. */
const VEGGIE: BuilderOption = { id: 'veggie', label: 'Veggie (fajitas + guac)', items: [{ id: '104180', qty: 1 }, { id: '104054409', qty: 1 }] };

export const chipotle: BuilderConfig = {
  key: 'chipotle',
  chain: 'Chipotle Mexican Grill',
  title: 'Build your Chipotle',
  footnote: 'Chipotle’s published nutrition for each ingredient, added up. Portions at the counter vary.',
  defaultSelection: { bowl: 1, chicken: 1, white: 1, black: 1 },
  steps: [
    {
      id: 'base',
      title: 'Start with',
      mode: 'one',
      options: [
        { id: 'bowl', label: 'Bowl', items: [] },
        one('burrito', 'Burrito', '1192699'),
        { id: 'tacos-soft', label: 'Soft tacos (3)', items: [{ id: '71346372', qty: 3 }] },
        { id: 'tacos-crispy', label: 'Crispy tacos (3)', items: [{ id: '71231049', qty: 3 }] },
        one('salad', 'Salad', '71346806'),
      ],
    },
    {
      id: 'protein',
      title: 'Protein',
      hint: 'Tap 2× for double.',
      mode: 'many',
      options: [
        one('chicken', 'Chicken', '52051', true),
        one('steak', 'Steak', '91351', true),
        one('barbacoa', 'Barbacoa', '728386', true),
        one('carnitas', 'Carnitas', '71346644', true),
        one('sofritas', 'Sofritas', '5674710', true),
        one('al-pastor', 'Chicken al Pastor', '71581726', true),
        one('carne-asada', 'Carne Asada', '41152255', true),
        one('pollo-asado', 'Pollo Asado', '137536530', true),
        one('honey-chicken', 'Chipotle Honey Chicken', '100199987', true),
        one('brisket', 'Smoked Brisket', '88043208', true),
        VEGGIE,
      ],
    },
    { id: 'rice', title: 'Rice', mode: 'one', options: [one('white', 'White rice', '71346478', true), one('brown', 'Brown rice', '3921504', true), { id: 'no-rice', label: 'No rice', items: [] }] },
    { id: 'beans', title: 'Beans', mode: 'one', options: [one('black', 'Black beans', '80096', true), one('pinto', 'Pinto beans', '708742', true), { id: 'no-beans', label: 'No beans', items: [] }] },
    {
      id: 'toppings',
      title: 'Toppings',
      hint: 'As many as you like.',
      mode: 'many',
      options: [
        one('fajita', 'Fajita veggies', '104180'),
        one('tomato-salsa', 'Fresh tomato salsa', '2155467'),
        one('corn-salsa', 'Roasted chili-corn salsa', '71346607'),
        one('green-salsa', 'Tomatillo-green chili salsa', '71346639'),
        one('red-salsa', 'Tomatillo-red chili salsa', '71346681'),
        one('sour-cream', 'Sour cream', '642489'),
        one('cheese', 'Cheese', '52054'),
        one('lettuce', 'Romaine lettuce', '104054524'),
        one('guac', 'Guacamole', '104054409'),
        one('queso', 'Queso blanco', '104054504'),
        one('vinaigrette', 'Chipotle-honey vinaigrette', '71346957'),
        one('adobo-ranch', 'Adobo ranch', '103070142'),
        one('chimichurri', 'Red chimichurri', '110670984'),
      ],
    },
    {
      id: 'extras',
      title: 'On the side',
      mode: 'many',
      unscaled: true,
      options: [
        one('chips', 'Chips', '104054254'),
        one('chips-large', 'Large chips', '104054240'),
        one('side-guac', 'Side of guac', '104054406'),
        one('side-queso', 'Side of queso', '104054519'),
        one('coke', 'Coca-Cola (22 oz)', '71347007'),
        one('diet-coke', 'Diet Coke (22 oz)', '71347060'),
        one('sprite', 'Sprite (22 oz)', '71347091'),
        one('lemonade', 'Tractor lemonade (22 oz)', '71347257'),
        one('iced-tea', 'Iced tea (22 oz)', '71347202'),
      ],
    },
  ],
  nameOf(selection: Selection) {
    const base = this.steps[0].options.find((option) => selection[option.id])?.label ?? 'Bowl';
    const proteins = pickedLabels(this, selection, 'protein').map((label) => titleCase(label.replace(/ \(.*\)$/, '')));
    const baseWord = base.startsWith('Soft') ? 'Soft Tacos' : base.startsWith('Crispy') ? 'Crispy Tacos' : base;
    return `${proteins.length > 0 ? proteins.join(' & ') : 'Veggie'} ${baseWord}`;
  },
  describe(selection: Selection) {
    return ['rice', 'beans', 'toppings', 'extras']
      .flatMap((step) => pickedLabels(this, selection, step))
      .filter((label) => !label.startsWith('no '))
      .join(', ');
  },
};
