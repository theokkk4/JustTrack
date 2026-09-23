import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { addDays, startOfDay } from '@/utils/date';

interface CurrentTime {
  now: Date;
  today: Date;
}

/**
 * Time as reactive state. With the React Compiler on, calling `new Date()`
 * during render can be memoized indefinitely, so anything time-dependent
 * (greeting, "today") must come from here. Refreshes when the app returns
 * to the foreground and at local midnight.
 */
export function useCurrentTime(): CurrentTime {
  const [now, setNow] = useState(() => new Date());
  const today = startOfDay(now);
  const todayMs = today.getTime();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const msUntilTomorrow = addDays(new Date(todayMs), 1).getTime() - Date.now();
    const timer = setTimeout(() => setNow(new Date()), Math.max(msUntilTomorrow, 0) + 1000);
    return () => clearTimeout(timer);
  }, [todayMs]);

  return { now, today };
}
