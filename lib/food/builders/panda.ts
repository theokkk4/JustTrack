import { pickedLabels, titleCase, type BuilderConfig, type BuilderOption, type Selection } from './types';

const one = (id: string, label: string, itemId: string, doubleable = false): BuilderOption => ({ id, label, items: [{ id: itemId, qty: 1 }], doubleable });
const half = (id: string, label: string, a: string, b: string): BuilderOption => ({ id, label, items: [{ id: a, qty: 0.5 }, { id: b, qty: 0.5 }] });

const CHOW_MEIN = '51920';
const FRIED_RICE = '47577';
const WHITE_RICE = '51921';
const SUPER_GREENS = '25704081';

/** A bowl is one entrée and a side, a plate two, a bigger plate three. */
export const panda: BuilderConfig = {
  key: 'panda',
  chain: 'Panda Express',
  title: 'Build your Panda Express',
  footnote: 'Panda Express’s published nutrition per entrée and side, added up.',
  defaultSelection: { 'chow-mein': 1, orange: 1 },
  steps: [
    {
      id: 'side',
      title: 'Side',
      hint: 'Half & half is a real order.',
      mode: 'one',
      options: [
        one('chow-mein', 'Chow mein', CHOW_MEIN),
        one('fried-rice', 'Fried rice', FRIED_RICE),
        one('white-rice', 'White steamed rice', WHITE_RICE),
        one('super-greens', 'Super greens', SUPER_GREENS),
        half('half-cm-fr', 'Half chow mein, half fried rice', CHOW_MEIN, FRIED_RICE),
        half('half-cm-wr', 'Half chow mein, half white rice', CHOW_MEIN, WHITE_RICE),
        half('half-fr-wr', 'Half fried rice, half white rice', FRIED_RICE, WHITE_RICE),
        half('half-cm-sg', 'Half chow mein, half super greens', CHOW_MEIN, SUPER_GREENS),
        half('half-fr-sg', 'Half fried rice, half super greens', FRIED_RICE, SUPER_GREENS),
        { id: 'no-side', label: 'No side (à la carte)', items: [] },
      ],
    },
    {
      id: 'entrees',
      title: 'Entrées',
      hint: 'One for a bowl, two for a plate, three for a bigger plate. Tap twice for a double portion.',
      mode: 'many',
      options: [
        one('orange', 'Orange Chicken', '4532802', true),
        one('hot-orange', 'Hot Orange Chicken', '128304145', true),
        one('beijing', 'Beijing Beef', '49415', true),
        one('broccoli-beef', 'Broccoli Beef', '1176491', true),
        one('black-pepper-chicken', 'Black Pepper Chicken', '51925', true),
        one('angus', 'Black Pepper Angus Steak', '72690975', true),
        one('sirloin', 'Black Pepper Sirloin Steak', '107423217', true),
        one('teriyaki', 'Grilled Teriyaki Chicken', '4917196', true),
        one('honey-sesame', 'Honey Sesame Chicken Breast', '6306769', true),
        one('honey-walnut', 'Honey Walnut Shrimp', '669874', true),
        one('kung-pao', 'Kung Pao Chicken', '51923', true),
        one('mushroom', 'Mushroom Chicken', '47576', true),
        one('string-bean', 'String Bean Chicken Breast', '46390', true),
        one('sweet-sour', 'Sweet & Sour Chicken Breast', '2976226', true),
        one('sweetfire', 'SweetFire Chicken Breast', '669864', true),
        one('eggplant-tofu', 'Eggplant Tofu', '43979', true),
        one('wok-shrimp', 'Wok-Fired Shrimp', '72691058', true),
        one('brisket', 'Cantonese BBQ Beef Brisket', '128490059', true),
        one('ginger-fish', 'Steamed Ginger Fish', '14488728', true),
        one('potato-chicken', 'Potato Chicken', '51926', true),
      ],
    },
    {
      id: 'appetizers',
      title: 'Appetizers',
      mode: 'many',
      unscaled: true,
      options: [one('egg-roll', 'Chicken egg roll', '72691017', true), one('spring-roll', 'Veggie spring rolls (2)', '72691045'), one('rangoon', 'Cream cheese rangoon (3)', '72691038'), one('potsticker', 'Chicken potstickers (3)', '72691034'), one('soup', 'Hot & sour soup (cup)', '72691118')],
    },
    {
      id: 'sauces',
      title: 'Sauces',
      mode: 'many',
      unscaled: true,
      options: [one('sweet-sour-sauce', 'Sweet & sour', '51940'), one('teriyaki-sauce', 'Teriyaki', '72691079'), one('chili-sauce', 'Chili', '4712540'), one('hot-mustard', 'Hot mustard', '72691085'), one('soy', 'Soy sauce', '4712544'), one('potsticker-sauce', 'Potsticker sauce', '51941')],
    },
    {
      id: 'extras',
      title: 'Drinks & dessert',
      mode: 'many',
      unscaled: true,
      options: [
        one('coke', 'Coca-Cola (medium)', '72380312'),
        one('diet-coke', 'Diet Coke (medium)', '72691203'),
        one('sprite', 'Sprite (medium)', '107423538'),
        one('sweet-tea', 'Sweet tea (medium)', '72691488'),
        one('lemonade', 'Lemonade (medium)', '72691401'),
        one('fortune-cookie', 'Fortune cookie', '72691091'),
        one('apple-pie-roll', 'Apple pie roll', '73782613'),
        one('cookie', 'Chocolate chunk cookie', '72691103'),
      ],
    },
  ],
  nameOf(selection: Selection) {
    const entrees = pickedLabels(this, selection, 'entrees');
    const portions = this.steps[1].options.reduce((sum, option) => sum + (selection[option.id] ?? 0), 0);
    const side = this.steps[0].options.find((option) => selection[option.id]);
    const sideLabel = side && side.id !== 'no-side' ? side.label : null;
    if (entrees.length === 0) return sideLabel ? `Side of ${sideLabel}` : 'Panda Express';
    const meal = !sideLabel ? 'à la carte' : portions >= 3 ? 'Bigger Plate' : portions === 2 ? 'Plate' : 'Bowl';
    return `${entrees.map(titleCase).join(' & ')} ${meal}`;
  },
  describe(selection: Selection) {
    const side = this.steps[0].options.find((option) => selection[option.id]);
    const sideLabel = side && side.id !== 'no-side' ? side.label.toLowerCase() : null;
    return [sideLabel, ...['appetizers', 'sauces', 'extras'].flatMap((step) => pickedLabels(this, selection, step))].filter(Boolean).join(', ');
  },
};
