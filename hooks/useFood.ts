import { useEffect, useState } from 'react';

import { useDiary } from '@/contexts/DiaryContext';
import { getFood } from '@/services/foodService';
import { getErrorMessage } from '@/utils/errors';

/**
 * One FatSecret food's details. Reads the shared in-memory cache (so a food
 * already in the diary shows instantly) and fetches it when missing.
 */
export function useFood(id: string | null | undefined) {
  const { foods } = useDiary();
  const food = id ? foods.get(id) : undefined;
  const hasFood = food !== undefined;
  const [failure, setFailure] = useState<{ id: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id || hasFood) return;
    let cancelled = false;
    getFood(id).catch((error: unknown) => {
      if (!cancelled) setFailure({ id, message: getErrorMessage(error) });
    });
    return () => {
      cancelled = true;
    };
  }, [id, hasFood, attempt]);

  const error = !hasFood && failure && failure.id === id ? failure.message : null;

  return {
    food,
    loading: Boolean(id) && !hasFood && error === null,
    error,
    retry: () => {
      setFailure(null);
      setAttempt((count) => count + 1);
    },
  };
}
