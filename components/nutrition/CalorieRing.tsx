import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { calculateProgress, calculateRemaining } from '@/lib/nutrition/calculateNutrition';
import { formatNumber } from '@/utils/format';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieRing({ consumed, goal, size = 220, strokeWidth = 18 }: CalorieRingProps) {
  const { colors } = useAppTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = calculateProgress(consumed, goal);
  const remaining = calculateRemaining(goal, consumed);
  const isOver = remaining < 0;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const arcColor = isOver ? colors.warning : colors.accent;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${formatNumber(consumed)} of ${formatNumber(goal)} calories eaten. ${
        isOver ? `${formatNumber(Math.abs(remaining))} over goal` : `${formatNumber(remaining)} remaining`
      }`}
    >
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.backgroundSecondary}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.center}>
          <ThemedText variant="largeTitle" style={styles.value}>
            {formatNumber(consumed)}
          </ThemedText>
          <ThemedText variant="caption2" color="secondary" style={styles.label}>
            CALORIES
          </ThemedText>
        </View>
      </View>
      <ThemedText variant="subheadEmphasized" style={[styles.remaining, isOver && { color: colors.warning }]}>
        {isOver ? `${formatNumber(Math.abs(remaining))} over` : `${formatNumber(remaining)} remaining`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  value: { fontVariant: ['tabular-nums'] },
  label: { letterSpacing: 1.2, marginTop: Spacing.xxs },
  remaining: { marginTop: Spacing.md, fontVariant: ['tabular-nums'] },
});
