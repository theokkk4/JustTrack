import * as Haptics from 'expo-haptics';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

/**
 * Pieces of the custom tab bar. They're composed inline in
 * app/(tabs)/_layout.tsx because expo-router/ui discovers routes by reading
 * the TabTrigger elements directly inside TabList.
 */

export function TabBarContainer({ style, children, ref, ...rest }: ViewProps & { ref?: React.Ref<View> }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      {...rest}
      ref={ref}
      accessibilityRole="tablist"
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, Spacing.sm),
        },
        style,
      ]}
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
      <ThemedText variant="caption2" style={{ color: tint }} numberOfLines={1}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function ScanTabButton({ isFocused, onPress, ref, ...rest }: TabTriggerSlotProps) {
  const { colors, shadows } = useAppTheme();

  return (
    <View style={styles.tab}>
      <Pressable
        {...rest}
        ref={ref}
        accessibilityRole="tab"
        accessibilityLabel="Scan food"
        accessibilityState={{ selected: Boolean(isFocused) }}
        onPress={(event) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress?.(event);
        }}
        style={({ pressed }) => [
          styles.scanButton,
          shadows.md,
          { backgroundColor: colors.scanButtonBackground, transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}
      >
        <AppIcon name="scan" size={26} color={colors.scanButtonIcon} weight="semibold" />
      </Pressable>
      <ThemedText
        variant="caption2"
        style={{ color: isFocused ? colors.tabIconSelected : colors.tabIconDefault }}
        numberOfLines={1}
      >
        Scan
      </ThemedText>
    </View>
  );
}

const SCAN_BUTTON_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    minHeight: 44,
  },
  scanButton: {
    width: SCAN_BUTTON_SIZE,
    height: SCAN_BUTTON_SIZE,
    borderRadius: SCAN_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -Spacing.xl,
  },
});
