import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase/client';
import type { AuthLinkParams } from '@/utils/authLink';

/** Where Supabase sends people back after tapping a link in an auth email. */
export function authCallbackUrl(): string {
  return Linking.createURL('auth-callback');
}

export async function signInWithEmail(email: string, password: string): Promise<{ userId: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return { userId: data.user.id };
}

/** Turns the tokens or code from an auth email link into a signed-in session. */
export async function exchangeAuthLink(params: AuthLinkParams): Promise<'session' | 'nothing'> {
  if (params.error) throw new Error(params.error);
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return 'session';
  }
  if (params.accessToken && params.refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: params.accessToken, refresh_token: params.refreshToken });
    if (error) throw error;
    return 'session';
  }
  return 'nothing';
}

export type SignUpResult = { status: 'signed-in'; userId: string } | { status: 'confirm-email' };

/** Returns 'confirm-email' when the project requires confirming the address before the first sign-in. */
export async function signUpWithEmail(email: string, password: string, displayName?: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: displayName?.trim() ? { display_name: displayName.trim() } : undefined,
      emailRedirectTo: authCallbackUrl(),
    },
  });
  if (error) throw error;
  return data.session && data.user ? { status: 'signed-in', userId: data.user.id } : { status: 'confirm-email' };
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: authCallbackUrl() } });
  if (error) throw error;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authCallbackUrl() });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

function isAppleCancellation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'ERR_REQUEST_CANCELED';
}

/**
 * Native Sign in with Apple. Apple gets a SHA-256 of a one-time nonce and
 * Supabase gets the raw value, so a stolen identity token can't be replayed.
 */
export async function signInWithApple(): Promise<{ status: 'signed-in'; userId: string } | { status: 'cancelled' }> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (isAppleCancellation(error)) return { status: 'cancelled' };
    throw error;
  }

  if (!credential.identityToken) {
    throw new Error('Apple didn’t return a sign-in token. Please try again.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

  // Apple shares the user's name only on their very first authorization.
  const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ').trim();
  if (name) {
    await supabase.from('profiles').update({ display_name: name.slice(0, 80) }).eq('id', data.user.id).is('display_name', null);
  }

  return { status: 'signed-in', userId: data.user.id };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Permanently deletes the account and all of its data server-side, then clears the local session. */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut({ scope: 'local' });
}
