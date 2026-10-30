#!/usr/bin/env node
/**
 * Builds assets/data/chain-foods.json: the menus of America's biggest
 * fast-food chains with calories and macros, from the FatSecret Platform
 * API (foods.search, OAuth 1.0). Credentials come from the environment and
 * are never written anywhere:
 *
 *   FATSECRET_KEY=… FATSECRET_SECRET=… node scripts/build-chain-foods.js
 *
 * Output rows: [id, chain, name, servingLabel, kcal, protein, carbs, fat]
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEY = process.env.FATSECRET_KEY;
const SECRET = process.env.FATSECRET_SECRET;
if (!KEY || !SECRET) {
  console.error('Set FATSECRET_KEY and FATSECRET_SECRET.');
  process.exit(1);
}

/** Search term → the brand names FatSecret files the chain's items under. */
const CHAINS = [
  ["McDonald's", ["mcdonald's"]],
  ['Starbucks', ['starbucks']],
  ['Chick-fil-A', ['chick-fil-a']],
  ['Taco Bell', ['taco bell']],
  ["Dunkin'", ["dunkin' donuts", 'dunkin donuts', "dunkin'"]],
  ["Wendy's", ["wendy's"]],
  ['Chipotle Mexican Grill', ['chipotle mexican grill', 'chipotle']],
  ['Burger King', ['burger king']],
  ["Domino's", ["domino's pizza", "domino's"]],
  ['Subway', ['subway']],
  ['Panda Express', ['panda express']],
  ['Panera Bread', ['panera bread', 'panera']],
  ['Popeyes', ['popeyes chicken & biscuits', 'popeyes louisiana kitchen', 'popeyes']],
  ["Raising Cane's", ["raising cane's"]],
  ['Sonic Drive-In', ['sonic', 'sonic drive-in']],
  ['Pizza Hut', ['pizza hut']],
  ['Dairy Queen', ['dairy queen']],
  ['Wingstop', ['wingstop']],
  ['KFC', ['kfc', 'kentucky fried chicken']],
  ["Jersey Mike's", ["jersey mike's", 'jersey mikes']],
  ["Arby's", ["arby's", 'arbys']],
  ['Little Caesars', ['little caesars', "little caesar's"]],
  ["Papa John's", ["papa john's", 'papa johns']],
  ['Jamba', ['jamba juice', 'jamba']],
  ['Insomnia Cookies', ['insomnia cookies']],
  ['Freshens', ['freshens']],
  ["Hangry Joe's", ["hangry joe's", 'hangry joes']],
  ['Wawa', ['wawa']],
  ['7 Brew', ['seven brew', '7 brew']],
  ['7-Eleven', ['7-eleven', '7 eleven', '7-select']],
  ["Applebee's", ["applebee's", 'applebees']],
  ["Auntie Anne's", ["auntie anne's pretzels", "auntie anne's"]],
];
const MAX_PAGES = 60;
const OUT = path.join(__dirname, '..', 'assets', 'data', 'chain-foods.json');

const enc = (value) => encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

async function call(params) {
  const all = {
    oauth_consumer_key: KEY,
    oauth_nonce: crypto.randomBytes(8).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: '1.0',
    format: 'json',
    ...params,
  };
  const base = Object.keys(all)
    .sort()
    .map((k) => `${enc(k)}=${enc(all[k])}`)
    .join('&');
  const endpoint = 'https://platform.fatsecret.com/rest/server.api';
  const signatureBase = `GET&${enc(endpoint)}&${enc(base)}`;
  const signature = crypto.createHmac('sha1', `${SECRET}&`).update(signatureBase).digest('base64');
  const response = await fetch(`${endpoint}?${base}&oauth_signature=${enc(signature)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(`${body.error.code}: ${body.error.message}`);
  return body;
}

/** "Per 1 sandwich - Calories: 540kcal | Fat: 28.00g | Carbs: 46.00g | Protein: 25.00g" */
function parseDescription(text) {
  const m = /^Per (.+?) - Calories: ([\d.]+)kcal \| Fat: ([\d.]+)g \| Carbs: ([\d.]+)g \| Protein: ([\d.]+)g/.exec(text ?? '');
  if (!m) return null;
  return { serving: m[1].trim(), kcal: Number(m[2]), fat: Number(m[3]), carbs: Number(m[4]), protein: Number(m[5]) };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function harvest(chain, brands) {
  const rows = new Map();
  let emptyPages = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    let body = null;
    // FatSecret throttles bursts ("too many actions"); back off and retry the same page rather than skip it.
    for (let attempt = 0; attempt < 6 && !body; attempt += 1) {
      try {
        body = await call({ method: 'foods.search', search_expression: chain, max_results: '50', page_number: String(page) });
      } catch (error) {
        console.error(`  ${chain} page ${page} (try ${attempt + 1}): ${error.message}`);
        await sleep(3000 * (attempt + 1));
      }
    }
    if (!body) {
      console.error(`  ${chain} page ${page}: giving up`);
      continue;
    }
    const foods = body.foods?.food;
    const list = Array.isArray(foods) ? foods : foods ? [foods] : [];
    if (list.length === 0) break;
    let matched = 0;
    for (const food of list) {
      const brand = String(food.brand_name ?? '').toLowerCase();
      if (!brands.includes(brand)) continue;
      const facts = parseDescription(food.food_description);
      if (!facts || !food.food_name) continue;
      matched += 1;
      rows.set(String(food.food_id), [String(food.food_id), chain, food.food_name.trim(), facts.serving, facts.kcal, facts.protein, facts.carbs, facts.fat]);
    }
    emptyPages = matched === 0 ? emptyPages + 1 : 0;
    // Results are ranked by relevance: once the brand stops appearing, the rest are other brands.
    if (emptyPages >= 3) break;
    await sleep(600);
  }
  return [...rows.values()];
}

(async () => {
  // Merge into what's already there, so a throttled run never loses items from a previous one.
  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')).rows : [];
  const merged = new Map(existing.map((row) => [row[0], row]));
  const only = process.argv.slice(2);
  for (const [chain, brands] of CHAINS) {
    if (only.length && !only.includes(chain)) continue;
    const rows = await harvest(chain, brands);
    console.log(`${chain}: ${rows.length} items`);
    rows.forEach((row) => merged.set(row[0], row));
  }
  const all = [...merged.values()];
  all.sort((a, b) => a[1].localeCompare(b[1]) || a[2].localeCompare(b[2]));
  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), source: 'FatSecret Platform API', rows: all }));
  console.log(`Wrote ${all.length} items to ${path.relative(process.cwd(), OUT)}`);
})();
