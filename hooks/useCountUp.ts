import { useEffect, useState } from 'react';

/** Eases a displayed number toward `target` over `durationMs`, like a counter settling. */
export function useCountUp(target: number, durationMs = 700): number {
  const [shown, setShown] = useState(target);

  useEffect(() => {
    const from = shown;
    if (from === target) return;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min((Date.now() - start) / durationMs, 1);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Only restart when the target moves; `shown` is just the starting point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return shown;
}
