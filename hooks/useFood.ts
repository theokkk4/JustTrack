import { useEffect, useMemo, useState } from 'react';

import { loadFood, peekFood } from '@/lib/food/foodStore';
import type { FoodDetail } from '@/types';
import { getErrorMessage } from '@/utils/errors';

/**
 * A food by key ("usda:…" or "off:…"). Built-in and already-seen foods are
 * available immediately; anything else is fetched from Open Food Facts.
 */
export function useFood(key: string | null | undefined) {
  const known = useMemo(() => (key ? peekFood(key) : null), [key]);
  const [fetched, setFetched] = useState<{ key: string; food: FoodDetail | null; error: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key || known) return;
    let cancelled = false;
    loadFood(key)
      .then((food) => {
        if (!cancelled) setFetched({ key, food, error: food ? null : 'We couldn’t find that food.' });
      })
      .catch((error: unknown) => {
        if (!cancelled) setFetched({ key, food: null, error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [key, known, attempt]);

  const result = fetched && fetched.key === key ? fetched : null;
  const food = known ?? result?.food ?? undefined;

  return {
    food,
    loading: Boolean(key) && !food && !result,
    error: food ? null : (result?.error ?? null),
    retry: () => {
      setFetched(null);
      setAttempt((count) => count + 1);
    },
  };
}
