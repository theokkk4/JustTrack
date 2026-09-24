import * as AppleAuthentication from 'expo-apple-authentication';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radii } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { isAppleSignInAvailable } from '@/services/authService';

interface AppleSignInButtonProps {
  onPress: () => void;
  type?: 'sign-in' | 'continue';
  disabled?: boolean;
}

/** Apple's own button (required by App Review); renders nothing where Sign in with Apple isn't available. */
export function AppleSignInButton({ onPress, type = 'continue', disabled = false }: AppleSignInButtonProps) {
  const { isDark } = useAppTheme();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isAppleSignInAvailable()
      .then((result) => {
        if (!cancelled) setAvailable(result);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!available) return null;

  return (
    <View pointerEvents={disabled ? 'none' : 'auto'} style={disabled ? styles.disabled : undefined}>
      <AppleAuthentication.AppleAuthenticationButton
        // Style and type can't change after mount, so remount when the theme flips.
        key={isDark ? 'dark' : 'light'}
        buttonType={
          type === 'sign-in'
            ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            : AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
        }
        buttonStyle={
          isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={Radii.md}
        style={styles.button}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: { height: 52, width: '100%' },
  disabled: { opacity: 0.5 },
});
