import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProfileLoadError } from '@/components/ProfileLoadError';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DiaryProvider } from '@/contexts/DiaryContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';

export { AppErrorBoundary as ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 250 });

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PreferencesProvider>
            <AuthProvider>
              <OnboardingProvider>
                <DiaryProvider>
                  <RootNavigator />
                </DiaryProvider>
              </OnboardingProvider>
            </AuthProvider>
          </PreferencesProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { isDark, colors } = useAppTheme();
  const { status } = useAuth();

  // The native splash stays up until we know whether someone is signed in.
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [isDark, colors]);

  if (status === 'loading') return null;

  const ready = status === 'ready';

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {status === 'error' ? (
        <ProfileLoadError />
      ) : (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Protected guard={ready}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="settings/goals"
              options={{ headerShown: true, title: 'Nutrition Goals', headerBackTitle: 'Profile' }}
            />
          </Stack.Protected>
          <Stack.Protected guard={!ready}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'signedOut'}>
            <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
          </Stack.Protected>
          <Stack.Screen name="auth-callback" options={{ gestureEnabled: false }} />
          <Stack.Screen name="reset-password" options={{ gestureEnabled: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Not Found' }} />
        </Stack>
      )}
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
