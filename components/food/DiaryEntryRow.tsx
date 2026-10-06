import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import type { MealItem } from '@/types';
import { FoodRow } from './FoodRow';

interface DiaryEntryRowProps {
  item: MealItem;
  isLast: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMore: () => void;
}

const ACCESSIBILITY_ACTIONS = [
  { name: 'activate', label: 'Edit' },
  { name: 'duplicate', label: 'Duplicate' },
  { name: 'delete', label: 'Delete' },
];

function SwipeAction({ icon, label, color, onPress }: { icon: AppIconName; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.action, { backgroundColor: color }]}>
      <AppIcon name={icon} size={18} color="#FFFFFF" weight="semibold" />
      <ThemedText variant="caption2" style={styles.actionLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/**
 * A diary entry: tap to edit, swipe left for Duplicate / Delete, long-press
 * for the full menu. VoiceOver users get the same actions from the rotor.
 */
export function DiaryEntryRow({ item, isLast, onOpen, onDuplicate, onDelete, onMore }: DiaryEntryRowProps) {
  const { colors } = useAppTheme();
  const swipeable = useRef<SwipeableMethods>(null);

  const run = (action: () => void) => () => {
    swipeable.current?.close();
    action();
  };

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.actions}>
          <SwipeAction icon="duplicate" label="Duplicate" color={colors.textSecondary} onPress={run(onDuplicate)} />
          <SwipeAction icon="trash" label="Delete" color={colors.danger} onPress={run(onDelete)} />
        </View>
      )}
    >
      <FoodRow
        item={item}
        isLast={isLast}
        onPress={onOpen}
        onLongPress={onMore}
        accessibilityActions={ACCESSIBILITY_ACTIONS}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate') onOpen();
          if (event.nativeEvent.actionName === 'duplicate') onDuplicate();
          if (event.nativeEvent.actionName === 'delete') onDelete();
        }}
      />
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row' },
  action: { width: 84, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  actionLabel: { color: '#FFFFFF' },
});
