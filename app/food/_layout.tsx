import { Stack } from 'expo-router';
import React from 'react';

import { useAppTheme } from '@/contexts/ThemeContext';

/** The "Add Food" flow: presented as one modal, with search → food as a stack inside it. */
export default function FoodFlowLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="search" options={{ title: 'Add Food' }} />
      <Stack.Screen name="[id]" options={{ title: '', headerBackTitle: 'Search' }} />
    </Stack>
  );
}
