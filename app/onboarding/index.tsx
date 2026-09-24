import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/ui/Logo';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { signOut } from '@/services/authService';

// The welcome screen is always on black, matching the splash screen it follows.
const brand = Colors.dark;

export default function WelcomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { isDark } = useAppTheme();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light', true);
      return () => setStatusBarStyle(isDark ? 'light' : 'dark', true);
    }, [isDark])
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.root, { backgroundColor: brand.background }]}>
      <View style={styles.hero}>
        <Animated.View entering={FadeInDown.duration(700)}>
          <Logo width={132} color={brand.text} />
        </Animated.View>
        <Animated.Text
          entering={FadeIn.delay(250).duration(700)}
          style={[Typography.headline, styles.wordmark, { color: brand.text }]}
          accessibilityRole="header"
        >
          JUSTTRACK
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(450).duration(700)} style={[Typography.title3, styles.tagline, { color: brand.textSecondary }]}>
          Track your food.{'\n'}Understand your nutrition.
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInDown.delay(650).duration(600)} style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/onboarding/profile')}
          style={({ pressed }) => [styles.primary, { backgroundColor: brand.text, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[Typography.bodyEmphasized, { color: brand.textInverse }]}>{session ? 'Finish setting up' : 'Get Started'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => (session ? void signOut() : router.push('/sign-in'))}
          style={styles.secondary}
          hitSlop={8}
        >
          <Text style={[Typography.subheadEmphasized, { color: brand.text }]}>
            {session ? 'Use a different account' : 'I already have an account'}
          </Text>
        </Pressable>
        <Text style={[Typography.caption1, styles.fineprint, { color: brand.textTertiary }]}>
          Free and open source. No ads, no subscriptions.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Spacing['2xl'] },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  wordmark: { letterSpacing: 6, marginTop: Spacing.lg },
  tagline: { textAlign: 'center', fontWeight: '400' },
  actions: { gap: Spacing.md, paddingBottom: Spacing.lg },
  primary: { alignItems: 'center', justifyContent: 'center', borderRadius: Radii.md, paddingVertical: Spacing.lg },
  secondary: { alignItems: 'center', paddingVertical: Spacing.sm },
  fineprint: { textAlign: 'center', marginTop: Spacing.sm },
});
