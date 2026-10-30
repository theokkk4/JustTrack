import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useLightStatusBar } from '@/lib/statusBar';

interface GradientHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Where the gradient has fully faded into the page background, 0–1 of the header's height. */
  fadeEnd?: number;
}

/**
 * The violet crown on every main screen: deep at the status bar, fading
 * into the page background so content below feels like it rises out of it.
 */
export function GradientHeader({ children, style, fadeEnd = 1 }: GradientHeaderProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  useLightStatusBar();

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
      locations={[0, Math.max(0.35, fadeEnd * 0.55), fadeEnd]}
      style={[styles.gradient, { paddingTop: insets.top + Spacing.md }, style]}
    >
      <Halo />
      {children}
    </LinearGradient>
  );
}

/** Faint concentric rings behind the headline number, like ripples. */
function Halo() {
  const { colors } = useAppTheme();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[520, 400, 280].map((size) => (
        <View
          key={size}
          style={[
            styles.ring,
            { width: size, height: size, borderRadius: size / 2, marginLeft: -size / 2, marginTop: -size / 2 + 150, borderColor: colors.onGradient },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { paddingHorizontal: Spacing.lg, overflow: 'hidden' },
  ring: { position: 'absolute', left: '50%', top: 0, borderWidth: 1, opacity: 0.12 },
});
