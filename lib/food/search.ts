/**
 * Ranking for the bundled food database. USDA names read like
 * "Chicken breast, baked or broiled, skin not eaten", so words before the
 * first comma (the "head") say what the food *is* and count most; the rest
 * describes preparation. Pure and synchronous: ~5,000 foods rank in a few ms.
 */

export interface SearchEntry {
  name: string;
  category: string;
  head: string[];
  words: string[];
}

/** Lowercase, accent-free words with simple plurals folded ("berries" → "berry", "eggs" → "egg"). */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
      if (word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
      return word;
    });
}

export function toSearchEntry(name: string, category = ''): SearchEntry {
  return { name, category, head: tokenize(name.split(',')[0] ?? name), words: tokenize(`${name} ${category}`) };
}

function bestMatch(query: string, entry: SearchEntry): number {
  if (entry.head.includes(query)) return 4;
  if (query.length >= 2 && entry.head.some((word) => word.startsWith(query))) return 3;
  if (entry.words.includes(query)) return 2;
  if (query.length >= 2 && entry.words.some((word) => word.startsWith(query))) return 1.5;
  return 0;
}

/** A relevance score, or null when some query word doesn't match at all. */
export function scoreEntry(queryWords: string[], entry: SearchEntry): number | null {
  if (queryWords.length === 0) return null;
  let score = 0;
  for (const word of queryWords) {
    const match = bestMatch(word, entry);
    if (match === 0) return null;
    score += match;
  }
  // "banana" should find "Banana, raw" before "Banana bread".
  if (entry.head.every((word) => queryWords.includes(word))) score += 4;
  if (entry.head[0] === queryWords[0]) score += 2;
  // Baby foods match lots of plain words; only surface them when asked for.
  if (/baby|toddler|infant/i.test(entry.name) && !queryWords.some((word) => /baby|toddler|infant/.test(word))) score -= 6;
  return score - entry.name.length * 0.02;
}

export function rankEntries<T>(query: string, items: readonly T[], entryOf: (item: T) => SearchEntry, limit = 25): T[] {
  const queryWords = tokenize(query);
  const scored: { item: T; score: number; name: string }[] = [];
  for (const item of items) {
    const entry = entryOf(item);
    const score = scoreEntry(queryWords, entry);
    if (score !== null) scored.push({ item, score, name: entry.name });
  }
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return scored.slice(0, limit).map((result) => result.item);
}
