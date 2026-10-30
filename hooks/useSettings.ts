import { useSyncExternalStore } from 'react';

import { settingsStore } from '@/lib/settings/settingsStore';
import type { Settings } from '@/types';

export function useSettings(): Settings {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.getSnapshot, settingsStore.getSnapshot);
}
