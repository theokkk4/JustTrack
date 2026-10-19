import { useEffect, useMemo, useState } from 'react';

import { rememberFoods } from '@/lib/food/foodStore';
import { searchOpenFoodFacts } from '@/lib/food/openFoodFacts';
import { searchUsdaFoods } from '@/lib/food/usdaDatabase';
import type { FoodDetail } from '@/types';
import { getErrorMessage } from '@/utils/errors';

export const MIN_QUERY_LENGTH = 2;
/** Packaged-food pages to offer before suggesting a more specific search. */
const MAX_PAGES = 10;

interface Packaged {
  query: string;
  foods: FoodDetail[];
  page: number;
  pageCount: number;
  error: string | null;
}

function appendUnique(existing: FoodDetail[], next: FoodDetail[]): FoodDetail[] {
  const seen = new Set(existing.map((food) => food.id));
  return [...existing, ...next.filter((food) => !seen.has(food.id))];
}

/**
 * Two searches at once: the bundled USDA database (instant, offline) and
 * Open Food Facts for packaged foods (online, paged). Either can come up
 * empty or fail without affecting the other.
 */
export function useFoodSearch(query: string) {
  const active = query.length >= MIN_QUERY_LENGTH;
  const everyday = useMemo(() => (active ? searchUsdaFoods(query, 25) : []), [active, query]);

  const [packaged, setPackaged] = useState<Packaged | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    searchOpenFoodFacts(query, 1, controller.signal)
      .then((page) => {
        rememberFoods(page.foods);
        setPackaged({ query, foods: page.foods, page: 1, pageCount: page.pageCount, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setPackaged({ query, foods: [], page: 1, pageCount: 1, error: getErrorMessage(error) });
      });
    return () => controller.abort();
  }, [active, query, attempt]);

  const current = packaged?.query === query ? packaged : null;
  const hasMore = Boolean(current && !current.error && current.page < Math.min(current.pageCount, MAX_PAGES));

  const loadMore = async () => {
    if (!current || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await searchOpenFoodFacts(query, current.page + 1);
      rememberFoods(next.foods);
      setPackaged((previous) =>
        previous?.query === query
          ? { ...previous, page: current.page + 1, pageCount: next.pageCount, foods: appendUnique(previous.foods, next.foods) }
          : previous
      );
    } catch {
      // The first page is still usable; scrolling again retries.
    } finally {
      setLoadingMore(false);
    }
  };

  return {
    active,
    everyday,
    packaged: current?.foods ?? [],
    packagedStatus: !active ? 'idle' : !current ? 'loading' : current.error ? 'error' : 'ready',
    packagedError: current?.error ?? null,
    hasMore,
    loadingMore,
    loadMore,
    retryPackaged: () => {
      setPackaged(null);
      setAttempt((count) => count + 1);
    },
  } as const;
}
