import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon, type AppIconName } from './AppIcon';
import { Button } from './Button';
import { ThemedText } from './ThemedText';

interface EmptyStateProps {
  icon: AppIconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.backgroundSecondary }]}>
        <AppIcon name={icon} size={28} color={colors.textSecondary} />
      </View>
      <ThemedText variant="headline" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText variant="subhead" color="secondary" style={styles.message}>
        {message}
      </ThemedText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} size="md" fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', marginTop: Spacing.xs },
  action: { marginTop: Spacing.xl },
});
