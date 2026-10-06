import { useEffect, useState } from 'react';

import { searchFoods } from '@/services/foodService';
import type { FoodSearchResult } from '@/types';
import { getErrorMessage } from '@/utils/errors';

export const MIN_QUERY_LENGTH = 2;
/** The search function serves pages 0–39. */
const MAX_PAGES = 40;

interface Results {
  query: string;
  results: FoodSearchResult[];
  total: number;
  page: number;
  error: string | null;
}

function appendUnique(existing: FoodSearchResult[], next: FoodSearchResult[]): FoodSearchResult[] {
  const seen = new Set(existing.map((result) => result.id));
  return [...existing, ...next.filter((result) => !seen.has(result.id))];
}

/**
 * Paged food search for an (already debounced) query. A new query cancels the
 * previous request; the last results stay visible while the next page loads.
 */
export function useFoodSearch(query: string) {
  const [latest, setLatest] = useState<Results | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) return;
    const controller = new AbortController();
    searchFoods(query, 0, controller.signal)
      .then((page) => setLatest({ query, results: page.results, total: page.totalResults, page: 0, error: null }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLatest({ query, results: [], total: 0, page: 0, error: getErrorMessage(error) });
      });
    return () => controller.abort();
  }, [query, attempt]);

  const current = latest?.query === query ? latest : null;
  const status: 'idle' | 'loading' | 'error' | 'ready' =
    query.length < MIN_QUERY_LENGTH ? 'idle' : !current ? 'loading' : current.error ? 'error' : 'ready';
  const hasMore = Boolean(current && !current.error && current.results.length < current.total && current.page + 1 < MAX_PAGES);

  const loadMore = async () => {
    if (!current || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await searchFoods(query, current.page + 1);
      setLatest((previous) =>
        previous?.query === query
          ? { ...previous, page: current.page + 1, total: next.totalResults, results: appendUnique(previous.results, next.results) }
          : previous
      );
    } catch {
      // The footer offers the next page again on the next scroll; the first page's results stay usable.
    } finally {
      setLoadingMore(false);
    }
  };

  const retry = () => {
    setLatest(null);
    setAttempt((count) => count + 1);
  };

  return {
    status,
    // While a new query loads, keep showing the previous results rather than flashing to empty.
    results: status === 'idle' ? [] : (current ?? latest)?.results ?? [],
    error: current?.error ?? null,
    hasMore,
    loadingMore,
    loadMore,
    retry,
  };
}
