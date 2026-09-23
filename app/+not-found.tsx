import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

export default function NotFoundScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen scroll={false} edges={[]}>
      <View style={styles.container}>
        <ThemedText variant="title3">This screen doesn&apos;t exist.</ThemedText>
        <Link href="/" style={[styles.link, { color: colors.accent }]}>
          Go to Home
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  link: { fontSize: 17, fontWeight: '600' },
});
