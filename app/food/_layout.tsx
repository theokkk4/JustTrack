import { Stack } from 'expo-router';
import React from 'react';

import { useAppTheme } from '@/contexts/ThemeContext';

/** The "Add Food" flow: search, then the food itself (which draws its own header over its hero). */
export default function FoodFlowLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerTintColor: colors.text, headerStyle: { backgroundColor: colors.background }, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="search" options={{ headerShown: true, title: 'Add Food' }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="build" options={{ headerShown: true, title: 'Build your order' }} />
      <Stack.Screen name="chain" options={{ headerShown: true, title: '' }} />
    </Stack>
  );
}
