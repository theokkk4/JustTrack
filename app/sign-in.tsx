import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppleSignInButton } from '@/components/auth/AppleSignInButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { isDraftComplete, useFinishOnboarding } from '@/hooks/useFinishOnboarding';
import { sendPasswordReset, signInWithApple, signInWithEmail } from '@/services/authService';
import { getErrorMessage } from '@/utils/errors';
import { isValidEmail } from '@/utils/validation';

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { draft } = useOnboarding();
  const finishOnboarding = useFinishOnboarding();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'apple' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();

  // If they answered the onboarding questions before signing in, save those
  // answers (a no-op for accounts that already finished onboarding).
  const afterSignIn = async (userId: string) => {
    if (isDraftComplete(draft)) {
      await finishOnboarding(userId);
    }
  };

  const handleApple = async () => {
    setBusy('apple');
    setError(null);
    try {
      const result = await signInWithApple();
      if (result.status === 'cancelled') {
        setBusy(null);
        return;
      }
      await afterSignIn(result.userId);
    } catch (caught) {
      setError(getErrorMessage(caught));
      setBusy(null);
    }
  };

  const handleEmail = async () => {
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(undefined);
    setBusy('email');
    setError(null);
    try {
      const { userId } = await signInWithEmail(email, password);
      await afterSignIn(userId);
    } catch (caught) {
      setError(getErrorMessage(caught));
      setBusy(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!isValidEmail(email)) {
      setEmailError('Enter your email above, then tap “Forgot password?” again.');
      return;
    }
    setEmailError(undefined);
    try {
      await sendPasswordReset(email);
      Alert.alert('Check your email', `We sent a link to reset your password to ${email.trim()}.`);
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  };

  return (
    <OnboardingScaffold
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      backIcon="close"
      footer={<Button label="Sign in" onPress={handleEmail} loading={busy === 'email'} disabled={busy === 'apple' || !password} />}
    >
      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.dangerMuted }]} accessibilityLiveRegion="polite">
          <ThemedText variant="footnote" style={{ color: colors.danger }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <AppleSignInButton type="sign-in" onPress={handleApple} disabled={busy !== null} />
      <Divider label="or use email" />

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        placeholder="you@school.edu"
        error={emailError}
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleEmail}
      />

      <View style={styles.links}>
        <Pressable onPress={handleForgotPassword} accessibilityRole="button" hitSlop={8}>
          <ThemedText variant="subheadEmphasized">Forgot password?</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.replace('/onboarding/profile')} accessibilityRole="button" hitSlop={8}>
          <ThemedText variant="subhead" color="secondary">
            New here? <ThemedText variant="subheadEmphasized">Get started</ThemedText>
          </ThemedText>
        </Pressable>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  errorBanner: { padding: Spacing.md, borderRadius: Radii.md },
  links: { alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.sm },
});
