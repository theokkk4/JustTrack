import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';

import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { ThemedText } from '@/components/ui/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { updatePassword } from '@/services/authService';
import { getErrorMessage } from '@/utils/errors';
import { passwordError } from '@/utils/validation';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [saving, setSaving] = useState(false);

  if (!session) {
    return (
      <OnboardingScaffold
        title="Link expired"
        subtitle="This password reset link is no longer valid. Request a new one from the sign-in screen."
        showBack={false}
        footer={<Button label="Back to sign in" onPress={() => router.replace('/sign-in')} />}
      >
        <></>
      </OnboardingScaffold>
    );
  }

  const handleSave = async () => {
    const nextErrors = {
      password: passwordError(password),
      confirm: password === confirm ? undefined : 'Passwords don’t match.',
    };
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirm) return;

    setSaving(true);
    try {
      await updatePassword(password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Password updated', 'You’re all set.', [{ text: 'OK', onPress: () => router.replace('/') }]);
    } catch (caught) {
      setErrors({ password: getErrorMessage(caught) });
      setSaving(false);
    }
  };

  return (
    <OnboardingScaffold
      title="Choose a new password"
      showBack={false}
      footer={<Button label="Save password" onPress={handleSave} loading={saving} />}
    >
      <ThemedText variant="body" color="secondary">
        For {session.user.email ?? 'your account'}
      </ThemedText>
      <TextField
        label="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        passwordRules="minlength: 8;"
        error={errors.password}
      />
      <TextField
        label="Confirm new password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        error={errors.confirm}
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />
    </OnboardingScaffold>
  );
}
