import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppleSignInButton } from '@/components/auth/AppleSignInButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useFinishOnboarding } from '@/hooks/useFinishOnboarding';
import { resendConfirmationEmail, signInWithApple, signUpWithEmail } from '@/services/authService';
import { getErrorMessage } from '@/utils/errors';
import { isValidEmail, passwordError } from '@/utils/validation';

export default function CreateAccountScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const finishOnboarding = useFinishOnboarding();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'apple' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [confirmEmailFor, setConfirmEmailFor] = useState<string | null>(null);

  // Once onboarding is saved the auth status becomes 'ready' and the router
  // moves into the app on its own — so on success, just stay busy.
  const finish = async (userId: string) => {
    await finishOnboarding(userId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      await finish(result.userId);
    } catch (caught) {
      setError(getErrorMessage(caught));
      setBusy(null);
    }
  };

  const handleEmail = async () => {
    const nextErrors = {
      email: isValidEmail(email) ? undefined : 'Enter a valid email address.',
      password: passwordError(password),
    };
    setFieldErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setBusy('email');
    setError(null);
    try {
      const result = await signUpWithEmail(email, password, name);
      if (result.status === 'confirm-email') {
        setConfirmEmailFor(email.trim());
        setBusy(null);
        return;
      }
      await finish(result.userId);
    } catch (caught) {
      setError(getErrorMessage(caught));
      setBusy(null);
    }
  };

  if (confirmEmailFor) {
    return <ConfirmEmail email={confirmEmailFor} onUseDifferentEmail={() => setConfirmEmailFor(null)} />;
  }

  return (
    <OnboardingScaffold
      title="Save your plan"
      subtitle="Create a free account so your goals and food log are backed up — and private to you."
      footer={
        <Button label="Create account" onPress={handleEmail} loading={busy === 'email'} disabled={busy === 'apple'} />
      }
    >
      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.dangerMuted }]} accessibilityLiveRegion="polite">
          <ThemedText variant="footnote" style={{ color: colors.danger }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <AppleSignInButton onPress={handleApple} disabled={busy !== null} />
      <Divider label="or use email" />

      <TextField
        label="Name (optional)"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        maxLength={80}
        placeholder="Alex"
      />
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
        error={fieldErrors.email}
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        passwordRules="minlength: 8;"
        placeholder="At least 8 characters"
        error={fieldErrors.password}
        returnKeyType="go"
        onSubmitEditing={handleEmail}
      />

      <Pressable onPress={() => router.push('/sign-in')} accessibilityRole="button" style={styles.link} hitSlop={8}>
        <ThemedText variant="subhead" color="secondary">
          Already have an account?{' '}
          <ThemedText variant="subheadEmphasized">Sign in</ThemedText>
        </ThemedText>
      </Pressable>
    </OnboardingScaffold>
  );
}

function ConfirmEmail({ email, onUseDifferentEmail }: { email: string; onUseDifferentEmail: () => void }) {
  const { colors } = useAppTheme();
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const resend = async () => {
    setResendState('sending');
    setError(null);
    try {
      await resendConfirmationEmail(email);
      setResendState('sent');
    } catch (caught) {
      setError(getErrorMessage(caught));
      setResendState('idle');
    }
  };

  return (
    <OnboardingScaffold
      title="Check your email"
      subtitle={`We sent a confirmation link to ${email}. Open it on this iPhone to finish — your answers are saved.`}
      footer={
        <>
          <Button label="Open Mail" icon="mail" onPress={() => Linking.openURL('message://').catch(() => {})} />
          <Button
            label={resendState === 'sent' ? 'Email sent again' : 'Resend email'}
            variant="ghost"
            onPress={resend}
            loading={resendState === 'sending'}
            disabled={resendState === 'sent'}
          />
        </>
      }
    >
      <View style={[styles.mailIcon, { backgroundColor: colors.backgroundSecondary }]}>
        <AppIcon name="mail" size={32} color={colors.text} />
      </View>
      {error ? (
        <ThemedText variant="footnote" style={{ color: colors.danger }}>
          {error}
        </ThemedText>
      ) : null}
      <Pressable onPress={onUseDifferentEmail} accessibilityRole="button" style={styles.link} hitSlop={8}>
        <ThemedText variant="subheadEmphasized">Use a different email</ThemedText>
      </Pressable>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  errorBanner: { padding: Spacing.md, borderRadius: Radii.md },
  link: { alignSelf: 'center', paddingVertical: Spacing.sm },
  mailIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
