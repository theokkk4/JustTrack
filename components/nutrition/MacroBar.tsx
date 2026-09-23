import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { calculateProgress } from '@/lib/nutrition/calculateNutrition';
import { formatNumber } from '@/utils/format';

interface MacroBarProps {
  label: string;
  consumed: number;
  goal: number;
  color: string;
  trackColor: string;
}

export function MacroBar({ label, consumed, goal, color, trackColor }: MacroBarProps) {
  const progress = calculateProgress(consumed, goal);
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [progress, animatedProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}: ${formatNumber(consumed)} of ${formatNumber(goal)} grams`}
    >
      <View style={styles.header}>
        <ThemedText variant="subheadEmphasized">{label}</ThemedText>
        <ThemedText variant="subhead" color="secondary" style={styles.value}>
          <ThemedText variant="subheadEmphasized">{formatNumber(consumed)}</ThemedText> / {formatNumber(goal)}g
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  value: { fontVariant: ['tabular-nums'] },
  track: {
    height: 8,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radii.full,
  },
});
