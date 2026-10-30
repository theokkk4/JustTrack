import { createPersistedStore } from '@/lib/storage/persistedStore';

const MAX_RECENT = 8;

function parse(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, MAX_RECENT);
}

/** The last few things searched, newest first, so they're one tap away next time. */
export const recentSearchesStore = createPersistedStore<string[]>('justtrack.recentSearches.v1', [], parse);

export function rememberSearch(query: string): void {
  const term = query.trim();
  if (term.length < 2) return;
  recentSearchesStore.set((current) => [term, ...current.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT));
}

export function clearRecentSearches(): void {
  recentSearchesStore.set([]);
}

/** Things worth trying when the recents are empty. */
export const SUGGESTED_SEARCHES: readonly string[] = ['Chobani', 'Banana', 'Chipotle bowl', 'Protein bar', 'Iced latte', 'Chicken breast'];
