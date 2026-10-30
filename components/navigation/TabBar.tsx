import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

/**
 * The tab bar: four quiet icons and, in the middle, the one button that
 * matters — a big round + that starts logging. Composed inline in
 * app/(tabs)/_layout.tsx because expo-router/ui reads the TabTriggers there.
 */

export function TabBarContainer({ style, children, ref, ...rest }: ViewProps & { ref?: React.Ref<View> }) {
  const { colors, shadows } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      {...rest}
      ref={ref}
      accessibilityRole="tablist"
      style={[styles.container, shadows.md, { backgroundColor: colors.tabBarBackground, paddingBottom: Math.max(insets.bottom, Spacing.md) }, style]}
    >
      {children}
    </View>
  );
}

interface TabBarButtonProps extends TabTriggerSlotProps {
  icon: AppIconName;
  activeIcon?: AppIconName;
  label: string;
}

export function TabBarButton({ icon, activeIcon, label, isFocused, onPress, style, ref, ...rest }: TabBarButtonProps) {
  const { colors } = useAppTheme();
  const tint = isFocused ? colors.tabIconSelected : colors.tabIconDefault;

  return (
    <Pressable
      {...rest}
      ref={ref}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(isFocused) }}
      onPress={(event) => {
        if (!isFocused) Haptics.selectionAsync();
        onPress?.(event);
      }}
      // TabTrigger injects a row layout; ours must come last to win.
      style={(state) => [typeof style === 'function' ? style(state) : style, styles.tab]}
    >
      <AppIcon name={isFocused && activeIcon ? activeIcon : icon} size={24} color={tint} />
    </Pressable>
  );
}

/** The + in the middle of the bar: opens Add Food for whichever meal fits the time of day. */
export function AddButton() {
  const router = useRouter();
  const { colors, shadows } = useAppTheme();

  return (
    <View style={styles.tab}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/food/search');
        }}
        accessibilityRole="button"
        accessibilityLabel="Add food"
        style={({ pressed }) => [styles.fab, shadows.lg, { backgroundColor: colors.fab, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
      >
        <AppIcon name="plus" size={28} color={colors.fabIcon} weight="semibold" />
      </Pressable>
    </View>
  );
}

const FAB_SIZE = 64;

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.sm, paddingHorizontal: Spacing.sm },
  tab: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  fab: { width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2, alignItems: 'center', justifyContent: 'center', marginTop: -Spacing['2xl'] },
});
