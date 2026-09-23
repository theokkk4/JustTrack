import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface ScanOptionCardProps {
  icon: AppIconName;
  title: string;
  description: string;
  badge?: string;
  /** Leave undefined for an option that isn't available yet — it renders disabled and marked "Soon". */
  onPress?: () => void;
  prominent?: boolean;
}

export function ScanOptionCard({ icon, title, description, badge, onPress, prominent = false }: ScanOptionCardProps) {
  const { colors, shadows } = useAppTheme();
  const available = Boolean(onPress);
  const background = prominent ? colors.text : colors.surface;
  const foreground = prominent ? colors.textInverse : colors.text;
  const secondary = prominent ? colors.textInverse : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!available}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}${available ? '' : ' Not available yet.'}`}
      accessibilityState={{ disabled: !available }}
      style={({ pressed }) => [
        styles.card,
        shadows.sm,
        {
          backgroundColor: background,
          borderColor: colors.border,
          opacity: available ? (pressed ? 0.9 : 1) : 0.55,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: prominent ? 'rgba(127,127,127,0.25)' : colors.backgroundSecondary }]}>
        <AppIcon name={icon} size={26} color={foreground} />
      </View>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <ThemedText variant="headline" style={{ color: foreground }}>
            {title}
          </ThemedText>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <ThemedText variant="caption2" style={styles.badgeText}>
                {badge}
              </ThemedText>
            </View>
          ) : null}
          {!available ? (
            <View style={[styles.badge, { backgroundColor: colors.backgroundSecondary }]}>
              <ThemedText variant="caption2" color="secondary">
                Soon
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText variant="subhead" style={{ color: secondary, opacity: prominent ? 0.75 : 1 }}>
          {description}
        </ThemedText>
      </View>
      {available ? <AppIcon name="chevronRight" size={14} color={secondary} weight="semibold" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: Spacing.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radii.full },
  badgeText: { color: '#FFFFFF', letterSpacing: 0.5 },
});
