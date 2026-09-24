import { Stack } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

export default function OnboardingLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: Colors.dark.background } }} />
      <Stack.Screen name="profile" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="account" />
    </Stack>
  );
}
