import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { signOut } from '@/services/authService';

/** Shown when a signed-in user's profile can't be fetched and nothing is cached (e.g. first launch offline). */
export function ProfileLoadError() {
  const { colors } = useAppTheme();
  const { retry } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon="wifiOff"
        title="Can’t reach JustTrack"
        message="We couldn’t load your profile. Check your internet connection and try again."
        actionLabel="Try again"
        onAction={retry}
      />
      <View style={styles.signOut}>
        <Button label="Sign out" variant="ghost" onPress={() => void signOut()} fullWidth={false} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  signOut: { alignItems: 'center', marginTop: Spacing.sm },
});
