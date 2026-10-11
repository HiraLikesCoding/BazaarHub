'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import * as authService from '@/services/auth';

const AuthContext = createContext(null);

/**
 * Holds the logged in user for the whole app.
 * The session lives in Supabase Auth; the profile row adds name and role on
 * top of the auth user. The user shape is unchanged from the Express era.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // drop the JWT left over from the Express era
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('bazaarhub_token');
    }

    let sb;
    try {
      sb = getSupabase();
    } catch (err) {
      console.error(err);
      setLoading(false);
      return () => {};
    }

    // Fires immediately with the restored session (INITIAL_SESSION) and on
    // every later sign-in / sign-out / token refresh.
    const { data: subscription } = sb.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session && session.user) {
        try {
          setUser(await authService.fetchMe());
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (payload) => {
    const me = await authService.login(payload);
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (payload) => {
    const me = await authService.register(payload);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await getSupabase().auth.signOut();
    } catch {
      // local state is cleared either way
    }
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const me = await authService.fetchMe();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
