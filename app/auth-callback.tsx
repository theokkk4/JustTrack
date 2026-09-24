import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { exchangeAuthLink } from '@/services/authService';
import { parseAuthLink } from '@/utils/authLink';
import { getErrorMessage } from '@/utils/errors';

/** Landing route for links in auth emails (sign-up confirmation, password reset). */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const { status } = useAuth();
  const { colors } = useAppTheme();
  const handled = useRef(false);
  const [target, setTarget] = useState<{ href: Href; needsSession: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || handled.current) return;
    handled.current = true;
    const params = parseAuthLink(url);
    exchangeAuthLink(params)
      .then((result) =>
        setTarget({
          href: result === 'session' && params.type === 'recovery' ? '/reset-password' : '/',
          needsSession: result === 'session',
        })
      )
      .catch((caught) => setError(getErrorMessage(caught, 'That link is invalid or has expired.')));
  }, [url]);

  // When a session was just created, wait for its profile to load so the
  // router lands on the right screen instead of flashing the welcome screen.
  useEffect(() => {
    if (!target || status === 'loading') return;
    if (target.needsSession && status === 'signedOut') return;
    router.replace(target.href);
  }, [target, status, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {error ? (
        <View style={styles.content}>
          <ThemedText variant="title3" style={styles.center}>
            That link didn&apos;t work
          </ThemedText>
          <ThemedText variant="body" color="secondary" style={styles.center}>
            {error}
          </ThemedText>
          <Button label="Back to JustTrack" onPress={() => router.replace('/')} />
        </View>
      ) : (
        <View style={styles.content}>
          <ActivityIndicator color={colors.textSecondary} />
          <ThemedText variant="body" color="secondary" style={styles.center}>
            Signing you in…
          </ThemedText>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { alignItems: 'center', gap: Spacing.lg, padding: Spacing['2xl'] },
  center: { textAlign: 'center' },
});
