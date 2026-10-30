/**
 * Menu rows arrive with the chain's name glued on ("Chick-fil-A Cool Wrap",
 * "Chick-Fil-A Cool Wrap - Half", "Mcdonalds Big Mac"). On a list that
 * already says where the food is from, that's noise: strip it, and tidy the
 * separators left behind.
 */

const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

export function displayItemName(chain: string, name: string): string {
  const target = squash(chain);
  const parts = name.trim().split(/\s+/);
  if (!target) return name.trim();
  let built = '';
  let drop = 0;
  while (drop < parts.length && built.length < target.length) {
    built += squash(parts[drop]);
    drop += 1;
  }
  let rest = built === target && drop < parts.length ? parts.slice(drop).join(' ') : name.trim();
  rest = rest.replace(/^[\s\-–—:,]+/, '').trim();
  return rest || name.trim();
}

/** "1 serving" says nothing; anything more specific is worth a line. */
export function informativeServing(description: string): string | null {
  const text = description.trim();
  return /^1\s+servings?$/i.test(text) ? null : text;
}
