import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon, type AppIconName } from './AppIcon';
import { ThemedText } from './ThemedText';

interface ChoiceCardProps {
  title: string;
  description?: string;
  icon?: AppIconName;
  selected: boolean;
  onPress: () => void;
}

export function ChoiceCard({ title, description, icon, selected, onPress }: ChoiceCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.text : colors.border,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {icon ? (
        <View style={[styles.icon, { backgroundColor: colors.backgroundSecondary }]}>
          <AppIcon name={icon} size={20} color={colors.text} />
        </View>
      ) : null}
      <View style={styles.text}>
        <ThemedText variant="headline">{title}</ThemedText>
        {description ? (
          <ThemedText variant="footnote" color="secondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      <View
        style={[
          styles.radio,
          { borderColor: selected ? colors.text : colors.borderStrong, backgroundColor: selected ? colors.text : 'transparent' },
        ]}
      >
        {selected ? <AppIcon name="check" size={12} color={colors.textInverse} weight="bold" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
  },
  icon: { width: 40, height: 40, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
