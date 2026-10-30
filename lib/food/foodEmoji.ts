/**
 * Most generic foods have no photo, so they get an emoji on a tinted tile —
 * the same cue the scanner card uses. Specific dishes come first so
 * "chicken burrito" is a burrito, not a chicken.
 */

const EMOJI: [RegExp, string][] = [
  [/pizza/i, '🍕'],
  [/burger|cheeseburger|slider/i, '🍔'],
  [/burrito|wrap/i, '🌯'],
  [/taco|quesadilla|nacho/i, '🌮'],
  [/hot ?dog|frankfurter/i, '🌭'],
  [/fries|chips?\b|tater/i, '🍟'],
  [/sandwich|sub\b|hoagie|panini|blt/i, '🥪'],
  [/sushi|sashimi|roll\b/i, '🍣'],
  [/ramen|pho|noodle|lo mein|udon/i, '🍜'],
  [/pasta|spaghetti|macaroni|lasagna|penne|ravioli|fettuccine/i, '🍝'],
  [/rice|risotto|fried rice|pilaf/i, '🍚'],
  [/dumpling|wonton|gyoza/i, '🥟'],
  [/curry/i, '🍛'],
  [/soup|stew|chili|chowder|broth/i, '🍲'],
  [/salad|lettuce|kale|spinach|greens|arugula/i, '🥗'],
  [/pancake|waffle|french toast|crepe/i, '🥞'],
  [/bagel/i, '🥯'],
  [/croissant/i, '🥐'],
  [/pretzel/i, '🥨'],
  [/bread|toast|roll\b|bun\b|biscuit|muffin|tortilla|pita|naan/i, '🍞'],
  [/cereal|oat|granola|porridge|grits/i, '🥣'],
  [/egg|omelet|omelette|frittata/i, '🍳'],
  [/bacon/i, '🥓'],
  [/chicken|turkey|poultry|wing|nugget|drumstick/i, '🍗'],
  [/steak|beef|pork|lamb|ribs?\b|brisket|meatball|meatloaf|ham\b/i, '🥩'],
  [/sausage|chorizo|bratwurst|kielbasa/i, '🌭'],
  [/shrimp|prawn|scampi/i, '🍤'],
  [/crab|lobster/i, '🦀'],
  [/fish|salmon|tuna|cod\b|tilapia|trout|halibut|sardine|anchov|seafood/i, '🐟'],
  [/tofu|tempeh|edamame|soy/i, '🫛'],
  [/bean|lentil|chickpea|hummus|legume/i, '🫘'],
  [/broccoli|cauliflower/i, '🥦'],
  [/carrot/i, '🥕'],
  [/corn\b|popcorn/i, '🌽'],
  [/potato|hash brown|mashed/i, '🥔'],
  [/sweet potato|yam/i, '🍠'],
  [/avocado|guacamole/i, '🥑'],
  [/tomato|ketchup|marinara/i, '🍅'],
  [/pepper|capsicum/i, '🫑'],
  [/cucumber|pickle|zucchini/i, '🥒'],
  [/onion|garlic|leek|scallion/i, '🧅'],
  [/mushroom/i, '🍄'],
  [/eggplant|aubergine/i, '🍆'],
  [/apple|applesauce/i, '🍎'],
  [/banana|plantain/i, '🍌'],
  [/orange|tangerine|clementine|mandarin/i, '🍊'],
  [/grape|raisin/i, '🍇'],
  [/strawberr|raspberr/i, '🍓'],
  [/blueberr|blackberr|berry|berries/i, '🫐'],
  [/peach|nectarine|apricot/i, '🍑'],
  [/pear\b/i, '🍐'],
  [/watermelon|melon|cantaloupe|honeydew/i, '🍉'],
  [/mango|papaya/i, '🥭'],
  [/pineapple/i, '🍍'],
  [/cherr/i, '🍒'],
  [/lemon|lime|citrus/i, '🍋'],
  [/kiwi/i, '🥝'],
  [/coconut/i, '🥥'],
  [/fruit/i, '🍎'],
  [/vegetable|veggie|squash|asparagus|celery|cabbage|brussels|beet|radish|turnip|artichoke/i, '🥬'],
  [/cheese|queso|parmesan|mozzarella|cheddar/i, '🧀'],
  [/yogurt|yoghurt|kefir/i, '🥣'],
  [/ice cream|gelato|sorbet|frozen yogurt|sundae/i, '🍦'],
  [/milk|latte|cappuccino|cream\b/i, '🥛'],
  [/butter|margarine/i, '🧈'],
  [/cookie|brownie|blondie|biscotti/i, '🍪'],
  [/cake|cupcake|cheesecake|pie\b|tart|pastry|danish|éclair|eclair/i, '🍰'],
  [/donut|doughnut/i, '🍩'],
  [/chocolate|cocoa|fudge|truffle/i, '🍫'],
  [/candy|gummy|gummies|lollipop|jelly bean|licorice|caramel|toffee|marshmallow/i, '🍬'],
  [/honey|syrup|jam|jelly|sugar/i, '🍯'],
  [/coffee|espresso|americano|cold brew/i, '☕'],
  [/tea\b|matcha|chai/i, '🍵'],
  [/soda|cola|pepsi|sprite|energy drink|lemonade|juice|smoothie|shake|slushie/i, '🥤'],
  [/beer|ale\b|lager|ipa\b/i, '🍺'],
  [/wine|champagne|prosecco|sangria/i, '🍷'],
  [/cocktail|margarita|vodka|whiskey|rum\b|tequila|gin\b|liquor|seltzer/i, '🍸'],
  [/water|sparkling/i, '💧'],
  [/nut|almond|peanut|cashew|pistachio|walnut|pecan|seed|trail mix|protein bar|granola bar|bar\b/i, '🥜'],
  [/cracker|rice cake/i, '🍘'],
  [/protein|whey|supplement/i, '🥤'],
  [/sauce|dressing|mayo|mustard|dip\b|salsa|gravy|oil\b/i, '🫙'],
  [/snack|chip/i, '🍿'],
  [/baby food|infant/i, '🍼'],
];

export const DEFAULT_FOOD_EMOJI = '🍽️';

/** The emoji for a food, from its name (and, failing that, its category or brand). */
export function foodEmojiFor(...descriptions: (string | null | undefined)[]): string {
  for (const description of descriptions) {
    if (!description) continue;
    const match = EMOJI.find(([pattern]) => pattern.test(description));
    if (match) return match[1];
  }
  return DEFAULT_FOOD_EMOJI;
}
