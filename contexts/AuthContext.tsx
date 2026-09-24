import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase/client';
import { fetchProfileBundle, type ProfileBundle } from '@/services/profileService';
import type { NutritionGoals, Profile } from '@/types';

/**
 * loading    — first launch; stored session not checked yet (splash stays up)
 * signedOut  — no session
 * onboarding — signed in, onboarding not finished
 * ready      — signed in and onboarded
 * error      — signed in, but the profile couldn't load and nothing is cached
 *
 * Status only moves once the profile for a new session has loaded, so the
 * router never briefly shows the wrong screen after signing in.
 */
export type AuthStatus = 'loading' | 'signedOut' | 'onboarding' | 'ready' | 'error';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  goals: NutritionGoals | null;
  latestWeightKg: number | null;
  /** Re-fetch profile and goals (after onboarding, editing goals, etc.). Throws if it can't. */
  refreshProfile: () => Promise<void>;
  /** Retry loading after an 'error' status. */
  retry: () => void;
}

const CACHE_KEY_PREFIX = 'justtrack.profileBundle.';

async function readCachedBundle(userId: string): Promise<ProfileBundle | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_PREFIX + userId);
    return raw ? (JSON.parse(raw) as ProfileBundle) : null;
  } catch {
    return null;
  }
}

function writeCachedBundle(userId: string, bundle: ProfileBundle) {
  AsyncStorage.setItem(CACHE_KEY_PREFIX + userId, JSON.stringify(bundle)).catch(() => {
    // Non-fatal: the app just won't be able to open offline next time.
  });
}

function statusFor(bundle: ProfileBundle): AuthStatus {
  return bundle.profile.onboardingCompletedAt ? 'ready' : 'onboarding';
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [bundle, setBundle] = useState<ProfileBundle | null>(null);

  const sessionRef = useRef<Session | null>(null);
  const loadedUserId = useRef<string | null>(null);
  // Every load gets a ticket; only the newest ticket may write state, so a
  // slow response for an old session can never overwrite a newer one.
  const latestRequest = useRef(0);

  const loadBundle = useCallback(async (userId: string, { useCache }: { useCache: boolean }) => {
    const request = ++latestRequest.current;
    let next: ProfileBundle | null;
    try {
      next = await fetchProfileBundle(userId);
      writeCachedBundle(userId, next);
    } catch (error) {
      if (!useCache) throw error;
      next = await readCachedBundle(userId);
    }
    if (request !== latestRequest.current) return;
    loadedUserId.current = userId;
    setBundle(next);
    setStatus(next ? statusFor(next) : 'error');
  }, []);

  const applySession = useCallback(
    (nextSession: Session | null) => {
      sessionRef.current = nextSession;
      setSession(nextSession);

      if (!nextSession) {
        latestRequest.current++;
        // Don't leave the previous user's profile readable on a shared device.
        if (loadedUserId.current) {
          AsyncStorage.removeItem(CACHE_KEY_PREFIX + loadedUserId.current).catch(() => {});
        }
        loadedUserId.current = null;
        setBundle(null);
        setStatus('signedOut');
        return;
      }
      if (loadedUserId.current !== nextSession.user.id) {
        void loadBundle(nextSession.user.id, { useCache: true });
      }
    },
    [loadBundle]
  );

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // supabase-js can deadlock if other supabase calls are awaited inside this callback.
      setTimeout(() => applySession(nextSession), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [applySession]);

  const refreshProfile = useCallback(async () => {
    const userId = sessionRef.current?.user.id;
    if (!userId) return;
    await loadBundle(userId, { useCache: false });
  }, [loadBundle]);

  const retry = useCallback(() => {
    const userId = sessionRef.current?.user.id;
    if (userId) void loadBundle(userId, { useCache: true });
  }, [loadBundle]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      profile: bundle?.profile ?? null,
      goals: bundle?.goals ?? null,
      latestWeightKg: bundle?.latestWeightKg ?? null,
      refreshProfile,
      retry,
    }),
    [status, session, bundle, refreshProfile, retry]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
