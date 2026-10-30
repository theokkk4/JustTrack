import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Logo } from '@/components/ui/Logo';
import { ThemedText } from '@/components/ui/ThemedText';
import { APP_NAME } from '@/constants/brand';
import { useAppTheme } from '@/contexts/ThemeContext';

/**
 * Shown while the on-device log and settings load: the mark breathing on
 * the brand gradient, with three dots rolling underneath. Usually a few
 * hundred milliseconds; long enough that a blank frame would feel broken.
 */
export function LoadingScreen() {
  const { colors } = useAppTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.set(withRepeat(withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })), -1, false));
  }, [pulse]);

  const mark = useAnimatedStyle(() => ({ transform: [{ scale: 0.94 + pulse.get() * 0.08 }], opacity: 0.85 + pulse.get() * 0.15 }));
  const halo = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.get() * 0.35 }], opacity: 0.35 - pulse.get() * 0.3 }));

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel={`${APP_NAME} is loading`}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMiddle]} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeIn.duration(300)} style={styles.center}>
        <View style={styles.markWrap}>
          <Animated.View style={[styles.halo, halo]} />
          <Animated.View style={[styles.mark, mark]}>
            <Logo width={64} color="#FFFFFF" />
          </Animated.View>
        </View>
        <ThemedText variant="title3" style={styles.name}>
          {APP_NAME}
        </ThemedText>
        <View style={styles.dots}>
          {[0, 1, 2].map((index) => (
            <Dot key={index} delay={index * 160} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const lift = useSharedValue(0);
  useEffect(() => {
    lift.set(withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }), withTiming(0, { duration: 400 })), -1, false)));
  }, [delay, lift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.get() * 6 }], opacity: 0.5 + lift.get() * 0.5 }));
  return <Animated.View style={[styles.dot, style]} />;
}

const MARK = 128;

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 14 },
  markWrap: { width: MARK, height: MARK, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: MARK, height: MARK, borderRadius: MARK / 2, backgroundColor: '#FFFFFF' },
  mark: { width: MARK, height: MARK, borderRadius: MARK / 2, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  name: { color: '#FFFFFF', letterSpacing: 0.3 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' },
});
