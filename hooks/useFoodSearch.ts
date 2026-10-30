import { useEffect, useMemo, useState } from 'react';

import { dedupeFoods } from '@/lib/food/dedupe';
import { rememberFoods } from '@/lib/food/foodStore';
import { searchOpenFoodFacts } from '@/lib/food/openFoodFacts';
import { detectChain, searchChainFoods } from '@/lib/food/chainDatabase';
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

/** Later pages repeat earlier products under other barcodes; the list stays deduplicated as it grows. */
function appendUnique(existing: FoodDetail[], next: FoodDetail[]): FoodDetail[] {
  return dedupeFoods([...existing, ...next]);
}

/**
 * Two searches at once: the bundled USDA database (instant, offline) and
 * Open Food Facts for packaged foods (online, paged). Either can come up
 * empty or fail without affecting the other.
 */
export function useFoodSearch(query: string) {
  const active = query.length >= MIN_QUERY_LENGTH;
  const everyday = useMemo(() => (active ? searchUsdaFoods(query, 25) : []), [active, query]);
  const restaurants = useMemo(() => (active ? searchChainFoods(query, 25) : []), [active, query]);
  const chainNamed = useMemo(() => (active ? detectChain(query).chain : null), [active, query]);

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
  // Products that share a name and brand but differ in nutrition get their macros shown so they can be told apart.
  const ambiguous = useMemo(() => {
    const counts = new Map<string, number>();
    for (const food of current?.foods ?? []) {
      const key = `${food.name.toLowerCase()}|${(food.brand ?? '').toLowerCase()}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return new Set([...counts].filter(([, count]) => count > 1).map(([key]) => key));
  }, [current?.foods]);
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
    restaurants,
    /** The chain the query names, if any — its menu then leads the results. */
    chainNamed,
    packaged: current?.foods ?? [],
    isAmbiguous: (food: FoodDetail) => ambiguous.has(`${food.name.toLowerCase()}|${(food.brand ?? '').toLowerCase()}`),
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
