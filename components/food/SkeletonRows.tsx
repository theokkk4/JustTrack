import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

/** Three breathing placeholder rows while packaged foods load, in place of a spinner. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  const { colors } = useAppTheme();
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 700 }), -1, true));
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceTint }]} accessibilityLabel="Loading packaged foods" accessible>
      {Array.from({ length: count }, (_, index) => (
        <Animated.View key={index} style={[styles.row, style, index < count - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
          <View style={[styles.thumb, { backgroundColor: colors.backgroundSecondary }]} />
          <View style={styles.lines}>
            <View style={[styles.line, { width: '62%', backgroundColor: colors.backgroundSecondary }]} />
            <View style={[styles.line, { width: '38%', backgroundColor: colors.backgroundSecondary }]} />
          </View>
          <View style={[styles.pill, { backgroundColor: colors.backgroundSecondary }]} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: Spacing.lg, borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 60 },
  thumb: { width: 40, height: 40, borderRadius: 12 },
  lines: { flex: 1, gap: 8 },
  line: { height: 12, borderRadius: 6 },
  pill: { width: 56, height: 26, borderRadius: 13 },
});
