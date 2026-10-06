import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { MEAL_TYPE_META, MEAL_TYPES } from '@/constants/nutrition';
import { entryDateKey, useDiary } from '@/contexts/DiaryContext';
import type { MealItem } from '@/types';
import { showActionMenu, showOptionSheet } from '@/utils/actionSheet';
import { getErrorMessage } from '@/utils/errors';

function reportFailure(title: string, error: unknown) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  Alert.alert(title, getErrorMessage(error));
}

/** What you can do to a diary entry from a list: open, duplicate, move, delete. */
export function useEntryActions() {
  const router = useRouter();
  const { duplicateEntry, deleteEntry, moveEntry } = useDiary();

  const open = (entry: MealItem) => {
    router.push({ pathname: '/entry/[id]', params: { id: entry.id, date: entryDateKey(entry) } });
  };

  const duplicate = (entry: MealItem) => {
    duplicateEntry(entry)
      .then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
      .catch((error) => reportFailure('Couldn’t duplicate', error));
  };

  const remove = (entry: MealItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteEntry(entry).catch((error) => reportFailure('Couldn’t delete', error));
  };

  const move = (entry: MealItem) => {
    showOptionSheet({
      title: 'Move to',
      options: MEAL_TYPES.map((value) => ({ value, label: MEAL_TYPE_META[value].label })),
      selected: entry.mealType,
      onSelect: (mealType) => {
        moveEntry(entry, mealType).catch((error) => reportFailure('Couldn’t move', error));
      },
    });
  };

  const more = (entry: MealItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showActionMenu({
      title: entry.foodName,
      actions: [
        { label: 'Edit', onPress: () => open(entry) },
        { label: 'Duplicate', onPress: () => duplicate(entry) },
        { label: 'Move to…', onPress: () => move(entry) },
        { label: 'Delete', destructive: true, onPress: () => remove(entry) },
      ],
    });
  };

  return { open, duplicate, remove, more };
}
