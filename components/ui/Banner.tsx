import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon, type AppIconName } from './AppIcon';
import { ThemedText } from './ThemedText';

interface BannerProps {
  tone?: 'info' | 'warning' | 'error';
  icon?: AppIconName;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** An inline notice for partial failures ("some foods couldn't load") with an optional retry. */
export function Banner({ tone = 'info', icon, message, actionLabel, onAction }: BannerProps) {
  const { colors } = useAppTheme();
  const tint = { info: colors.textSecondary, warning: colors.warning, error: colors.danger }[tone];
  const defaultIcon: AppIconName = tone === 'info' ? 'info' : 'wifiOff';

  return (
    <View
      style={[styles.banner, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <AppIcon name={icon ?? defaultIcon} size={18} color={tint} />
      <ThemedText variant="footnote" color="secondary" style={styles.message}>
        {message}
      </ThemedText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <ThemedText variant="footnote" style={[styles.action, { color: colors.accent }]}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  message: { flex: 1 },
  action: { fontWeight: '600' },
});
