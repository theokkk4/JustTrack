import React, { useEffect, useState } from 'react';

import { logStore } from '@/lib/log/logStore';
import { settingsStore } from '@/lib/settings/settingsStore';

/** Holds the first frame until the on-device log and settings have been read. */
export function StoreGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(() => logStore.isHydrated() && settingsStore.isHydrated());

  useEffect(() => {
    let cancelled = false;
    Promise.all([logStore.hydrate(), settingsStore.hydrate()]).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready ? <>{children}</> : null;
}
