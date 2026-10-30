import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { MEAL_TYPE_META, MEAL_TYPES } from '@/constants/nutrition';
import { createEntry } from '@/lib/log/entries';
import { addEntries, removeEntry, updateEntry } from '@/lib/log/logStore';
import type { LogEntry, MealType } from '@/types';
import { showActionMenu, showOptionSheet } from '@/utils/actionSheet';

/** What you can do to a logged entry from a list: open, log it again, move it, delete it. */
export function useEntryActions() {
  const router = useRouter();

  const open = (entry: LogEntry) => router.push({ pathname: '/entry/[id]', params: { id: entry.id } });

  const duplicate = (entry: LogEntry) => {
    const { id: _id, loggedAt: _loggedAt, ...rest } = entry;
    addEntries([createEntry(rest, new Date())]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const remove = (entry: LogEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeEntry(entry.id);
  };

  const move = (entry: LogEntry, mealType: MealType) => {
    if (mealType !== entry.mealType) updateEntry(entry.id, (current) => ({ ...current, mealType }));
  };

  const chooseMeal = (entry: LogEntry) => {
    showOptionSheet({
      title: 'Move to',
      options: MEAL_TYPES.map((value) => ({ value, label: MEAL_TYPE_META[value].label })),
      selected: entry.mealType,
      onSelect: (mealType) => move(entry, mealType),
    });
  };

  const more = (entry: LogEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showActionMenu({
      title: entry.foodName,
      actions: [
        { label: 'Edit', onPress: () => open(entry) },
        { label: 'Log again', onPress: () => duplicate(entry) },
        { label: 'Move to…', onPress: () => chooseMeal(entry) },
        { label: 'Delete', destructive: true, onPress: () => remove(entry) },
      ],
    });
  };

  return { open, duplicate, remove, move, chooseMeal, more };
}
